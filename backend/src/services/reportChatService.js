'use strict';

const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const sessions = new Map();

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const normalize = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const getSessionKey = (user) => user?.entityId || user?.id || user?.email || 'anonymous';

const extractText = async (file) => {
  if (!file) throw Object.assign(new Error('No report file uploaded'), { status: 400 });

  const mimetype = file.mimetype || '';
  const name = file.originalname || 'report';

  if (mimetype === 'text/plain' || name.toLowerCase().endsWith('.txt')) {
    return file.buffer.toString('utf8');
  }

  if (mimetype === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const parsed = await parser.getText();
      return parsed.text || '';
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.toLowerCase().endsWith('.docx')
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value || '';
  }

  throw Object.assign(new Error('Unsupported report type. Upload PDF, DOCX, or TXT.'), { status: 400 });
};

const summarizeReport = (text) => {
  const clean = normalize(text);
  if (!clean) return 'I could not find readable text in this report.';

  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  const important = sentences
    .map(normalize)
    .filter(Boolean)
    .filter((sentence) => /diagnos|impression|result|finding|abnormal|normal|high|low|positive|negative|recommend|history|medication|prescription|follow/i.test(sentence))
    .slice(0, 4);

  return (important.length ? important : sentences.map(normalize).filter(Boolean).slice(0, 4)).join(' ');
};

const tokenize = (text) => normalize(text)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter((word) => word.length > 2)
  .filter((word) => !new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'are', 'was', 'were', 'has', 'have', 'what', 'does', 'mean', 'report']).has(word));

const getOutputText = (response) => {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const text = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) text.push(content.text);
      if (typeof content.text === 'string') text.push(content.text);
    }
  }

  return text.join(' ').trim();
};

const buildAssistantPrompt = ({ question, reportText, fileName }) => {
  const context = reportText
    ? 'Uploaded report file: ' + fileName + '\nReport text:\n' + reportText.slice(0, 12000)
    : 'No report is uploaded. Answer as a general EHR and patient-support assistant.';

  return [
    {
      role: 'developer',
      content: [
        'You are MedChain EHR patient assistant.',
        'Answer in simple, calm language.',
        'Use uploaded report text when provided and do not invent facts not present in it.',
        'For medical decisions, diagnosis, treatment changes, dosage changes, emergencies, or severe symptoms, tell the patient to contact a qualified clinician or emergency care.',
        'Keep answers concise and practical, usually 3 to 6 sentences.',
      ].join(' '),
    },
    {
      role: 'user',
      content: context + '\n\nPatient question: ' + question,
    },
  ];
};

const answerWithOpenAI = async ({ question, reportText, fileName }) => {
  if (!process.env.OPENAI_API_KEY) return null;
  if (typeof fetch !== 'function') return null;

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: buildAssistantPrompt({ question, reportText, fileName }),
      max_output_tokens: 500,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || 'OpenAI request failed';
    throw Object.assign(new Error(message), { status: response.status });
  }

  return getOutputText(data);
};

const answerQuestion = (reportText, question) => {
  const cleanQuestion = normalize(question);
  if (!cleanQuestion) throw Object.assign(new Error('Question is required'), { status: 400 });

  const cleanReport = normalize(reportText);
  if (!cleanReport) {
    return 'Please upload a readable report first. I can answer questions after I extract text from it.';
  }

  const questionWords = tokenize(cleanQuestion);
  const sentences = (cleanReport.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanReport])
    .map(normalize)
    .filter(Boolean);

  const ranked = sentences
    .map((sentence) => {
      const lower = sentence.toLowerCase();
      const score = questionWords.reduce((total, word) => total + (lower.includes(word) ? 1 : 0), 0);
      const medicalBoost = /diagnos|impression|result|finding|abnormal|normal|high|low|positive|negative|recommend|medication|prescription|follow/i.test(sentence) ? 0.5 : 0;
      return { sentence, score: score + medicalBoost };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (!ranked.length) {
    return 'I could not find a direct match for that question in the uploaded report. Try asking about a specific test name, finding, diagnosis, medication, or recommendation mentioned in the report.';
  }

  return ranked.map((item) => item.sentence).join(' ');
};

const answerGeneralQuestion = (question) => {
  const cleanQuestion = normalize(question).toLowerCase();
  if (!cleanQuestion) throw Object.assign(new Error('Question is required'), { status: 400 });

  const topics = [
    {
      pattern: /appointment|visit|doctor|consult/i,
      answer: 'You can use the patient dashboard to review upcoming visits. If you have new or worsening symptoms, book a doctor visit or contact your care team directly.',
    },
    {
      pattern: /record|report|history|medical file|document/i,
      answer: 'Your medical records page shows ledger-backed health entries. You can open reports there, or upload a report here if you want me to answer questions from its text.',
    },
    {
      pattern: /prescription|medicine|medication|tablet|dose|dosage/i,
      answer: 'For medicines, always follow the prescription written by your clinician. I can help explain what a prescription says, but do not change dose or stop medication without medical advice.',
    },
    {
      pattern: /privacy|access|permission|share|doctor access/i,
      answer: 'Your EHR access controls are designed so only authorized users can view protected records. Use privacy or profile settings to review access, and ask an admin or care provider if something looks wrong.',
    },
    {
      pattern: /emergency|chest pain|breath|bleeding|stroke|faint|severe/i,
      answer: 'If this may be an emergency, seek urgent medical care immediately. Do not rely on this chatbot for emergency decisions.',
    },
    {
      pattern: /hello|hi|help|what can you do/i,
      answer: 'I can answer general questions about using the EHR, records, privacy, prescriptions, and appointments. If you upload a report, I can also answer questions based on that report text.',
    },
  ];

  const match = topics.find((topic) => topic.pattern.test(cleanQuestion));
  if (match) return match.answer;

  return 'I can help with general EHR questions and basic explanations. For medical decisions, diagnosis, or treatment advice, please consult a qualified clinician. You can also upload a report if you want me to answer from its contents.';
};

const saveReport = async (user, file) => {
  const text = await extractText(file);
  const cleanText = normalize(text);
  if (cleanText.length < 20) {
    throw Object.assign(new Error('The uploaded report does not contain enough readable text.'), { status: 400 });
  }

  const session = {
    fileName: file.originalname,
    uploadedAt: new Date().toISOString(),
    text: cleanText,
    summary: summarizeReport(cleanText),
  };

  sessions.set(getSessionKey(user), session);
  return {
    fileName: session.fileName,
    uploadedAt: session.uploadedAt,
    summary: session.summary,
    characterCount: cleanText.length,
  };
};

const getReport = (user) => {
  const session = sessions.get(getSessionKey(user));
  if (!session) return null;
  return {
    fileName: session.fileName,
    uploadedAt: session.uploadedAt,
    summary: session.summary,
    characterCount: session.text.length,
  };
};

const askReport = async (user, question) => {
  const cleanQuestion = normalize(question);
  if (!cleanQuestion) throw Object.assign(new Error('Question is required'), { status: 400 });

  const session = sessions.get(getSessionKey(user));
  const safetyNote = session
    ? 'This assistant summarizes the uploaded report and is not a medical diagnosis. Please confirm important decisions with a qualified clinician.'
    : 'This assistant gives general guidance and is not a medical diagnosis. Please confirm important decisions with a qualified clinician.';

  try {
    const aiAnswer = await answerWithOpenAI({
      question: cleanQuestion,
      reportText: session?.text || '',
      fileName: session?.fileName || '',
    });

    if (aiAnswer) {
      return {
        answer: aiAnswer,
        source: session?.fileName || 'openai-general-assistant',
        provider: 'openai',
        model: OPENAI_MODEL,
        safetyNote,
      };
    }
  } catch (err) {
    console.warn('OpenAI chatbot fallback:', err.message);
  }

  return {
    answer: session ? answerQuestion(session.text, cleanQuestion) : answerGeneralQuestion(cleanQuestion),
    source: session?.fileName || 'general-assistant',
    provider: 'local-fallback',
    safetyNote,
  };
};

const clearReport = (user) => sessions.delete(getSessionKey(user));

module.exports = { saveReport, getReport, askReport, clearReport };
