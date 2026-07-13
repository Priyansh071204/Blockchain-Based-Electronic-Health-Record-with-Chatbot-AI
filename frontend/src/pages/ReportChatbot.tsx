import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, FileText, Send, UploadCloud, Trash2, ShieldCheck } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useEHR } from '../hooks/useEHR';
import './ReportChatbot.css';

type ChatMessage = {
  id: string;
  sender: 'patient' | 'assistant';
  text: string;
  meta?: string;
};

const starterMessages: ChatMessage[] = [
  {
    id: 'welcome',
    sender: 'assistant',
    text: 'Ask me general EHR questions, or upload a report for report-specific answers.',
  },
];

const ReportChatbot: React.FC = () => {
  const ehr = useEHR();
  const [report, setReport] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [question, setQuestion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ehr.getChatReport()
      .then((res: any) => setReport(res.data.report))
      .catch(() => setReport(null));
  }, []);

  // Auto-scroll to bottom of chat thread when messages or loading state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  const uploadReport = async (file?: File) => {
    if (!file) return;
    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('report', file);
      const res = await ehr.uploadChatReport(formData);
      setReport(res.data.report);
      setMessages([
        ...starterMessages,
        {
          id: 'summary-' + Date.now(),
          sender: 'assistant',
          text: 'I read ' + res.data.report.fileName + '. Summary: ' + res.data.report.summary,
        },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not read this report. Try a PDF, DOCX, or TXT file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const askQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isAsking) return;

    setError('');
    setQuestion('');
    setIsAsking(true);
    setMessages((current) => [
      ...current,
      { id: 'q-' + Date.now(), sender: 'patient', text: cleanQuestion },
    ]);

    try {
      const res = await ehr.askChatQuestion(cleanQuestion);
      setMessages((current) => [
        ...current,
        {
          id: 'a-' + Date.now(),
          sender: 'assistant',
          text: res.data.answer + '\n\n' + res.data.safetyNote,
          meta: res.data.provider === 'openai' ? 'Answered by OpenAI' + (res.data.model ? ' · ' + res.data.model : '') : 'Answered by local fallback',
        },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not send the question. Please try again.');
    } finally {
      setIsAsking(false);
    }
  };

  const clearReport = async () => {
    await ehr.clearChatReport();
    setReport(null);
    setMessages(starterMessages);
  };

  return (
    <PageTransition>
      <div className="report-chatbot-page">
        <motion.header
          className="chatbot-hero"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div>
            <div className="chatbot-meta">
              <span className="care-pill care-pill-success pulse-lume">Patient assistant</span>
              <span className="metric-label">General and report Q&amp;A</span>
            </div>
            <h1>Ask the patient assistant</h1>
            <p className="text-dim">Ask general EHR questions anytime, or upload a report to ask about its findings and recommendations.</p>
          </div>
        </motion.header>

        <div className="chatbot-grid">
          <motion.section
            className="lume-panel report-upload-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="upload-icon"><UploadCloud size={28} /></div>
            <h2>Report upload</h2>
            <p className="text-dim">PDF, DOCX, or TXT reports up to the existing upload limit.</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => uploadReport(event.target.files?.[0])}
              hidden
            />

            <button
              type="button"
              className="btn-lume upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <UploadCloud size={16} />
              <span>{isUploading ? 'Reading report...' : 'Upload report'}</span>
            </button>

            {report && (
              <div className="report-card">
                <div className="report-card-title">
                  <FileText size={16} />
                  <span>{report.fileName}</span>
                </div>
                <p>{report.summary}</p>
                <div className="report-card-footer">
                  <span>{report.characterCount} characters read</span>
                  <button type="button" onClick={clearReport}>
                    <Trash2 size={14} /> Clear
                  </button>
                </div>
              </div>
            )}

            <div className="assistant-safety-note">
              <ShieldCheck size={16} />
              <span>This assistant explains report text. It does not replace a doctor.</span>
            </div>
          </motion.section>

          <motion.section
            className="lume-panel chat-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <header className="chat-panel-header">
              <div>
                <span className="metric-label">Chat</span>
                <h2>Patient questions</h2>
              </div>
              <Bot size={22} className="text-cyan" />
            </header>

            <div className="chat-thread">
              {messages.map((message) => (
                <div key={message.id} className={'chat-message ' + message.sender}>
                  <div className="chat-bubble">
                    {message.text}
                    {message.meta && <span className="chat-provider-meta">{message.meta}</span>}
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="chat-message assistant">
                  <div className="chat-bubble">Thinking through your question...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {error && <div className="chat-error">{error}</div>}

            <form className="chat-input-row" onSubmit={askQuestion}>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={report ? 'Ask about a test, diagnosis, medication, or recommendation...' : 'Ask about records, privacy, appointments, or upload a report...'}
                disabled={isAsking}
              />
              <button type="submit" className="btn-lume" disabled={isAsking || !question.trim()}>
                <Send size={16} />
                <span>Ask</span>
              </button>
            </form>
          </motion.section>
        </div>
      </div>
    </PageTransition>
  );
};

export default ReportChatbot;
