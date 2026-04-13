'use strict';

const path = require('path');
const fs = require('fs');
const { Gateway, Wallets } = require('fabric-network');
const logger = require('./logger');
const notificationService = require('../services/notificationService');

// ── Shared Connection State ───────────────────────────────────────────────────
let gateway = null;
let network = null;
let contract = null;

// ── In-memory mock store ──────────────────────────────────────────────────────
const store = new Map();
let mockIdCounter = 1000;

// Seed some initial data for the default patient (PAT001) if in MOCK mode
if (process.env.MOCK_FABRIC === 'true') {
(async () => {
  const ts = new Date().toISOString();
    
  // DOCTORS
  store.set('DOCTOR_DOC001', {
    docType: 'doctor',
    doctorId: 'DOC001',
    name: 'Dr. Smith',
    specialization: 'Cardiology',
    licenseNumber: 'MD123456',
    hospital: 'City General',
    createdAt: ts,
    updatedAt: ts,
    active: true,
    verified: true,
    version: 1
  });

  store.set('DOCTOR_DOC002', {
    docType: 'doctor',
    doctorId: 'DOC002',
    name: 'Dr. Sharma',
    specialization: 'General Medicine',
    licenseNumber: 'MD789012',
    hospital: 'Metro Health',
    createdAt: ts,
    updatedAt: ts,
    active: true,
    verified: true,
    version: 1
  });

  // PATIENTS
  store.set('PATIENT_PAT001', {
    docType: 'patient',
    patientId: 'PAT001',
    name: 'John Doe',
    email: 'patient@ehr.local',
    role: 'patient',
    dob: '1985-05-15',
    gender: 'Male',
    bloodGroup: 'O+',
    emergencyContact: 'Jane Doe (+1-555-0199)',
    recordIds: ['REC001', 'REC002', 'REC003', 'REC004'],
    prescriptionIds: ['RX001', 'RX002'],
    appointmentIds: ['APPO001'],
    billingIds: ['BILL001'],
    authorizedDoctors: [
        { doctorId: 'DOC001', grantedAt: ts, expiresAt: null, active: true },
        { doctorId: 'DOC002', grantedAt: ts, expiresAt: null, active: true }
    ],
    createdAt: ts,
    updatedAt: ts,
    active: true,
    version: 1
  });

  // RECORDS
  store.set('RECORD_REC001', {
    docType: 'healthRecord',
    recordId: 'REC001',
    patientId: 'PAT001',
    doctorId: 'DOC001',
    doctorName: 'Dr. Smith',
    recordType: 'Lab Result',
    title: 'Complete Blood Count (CBC)',
    description: 'Baseline metabolic panel showing normal levels of hemoglobin and white blood cells.',
    metadata: { tags: ['Hematology', 'Routine'] },
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    ledgerStatus: 'verified',
    txHash: '0x7e2a8b9c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5'
  });

  store.set('RECORD_REC002', {
    docType: 'healthRecord',
    recordId: 'REC002',
    patientId: 'PAT001',
    doctorId: 'DOC002',
    doctorName: 'Dr. Sharma',
    recordType: 'Prescription',
    title: 'Antihistamine Protocol',
    description: 'Seasonal allergy management. Prescribed Cetirizine 10mg.',
    metadata: { tags: ['Allergy', 'Medication'] },
    createdAt: '2026-03-20T14:30:00Z',
    updatedAt: '2026-03-20T14:30:00Z',
    ledgerStatus: 'verified',
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2'
  });

  store.set('RECORD_REC003', {
    docType: 'healthRecord',
    recordId: 'REC003',
    patientId: 'PAT001',
    doctorId: 'DOC001',
    doctorName: 'Dr. Smith',
    recordType: 'Radiology',
    title: 'Chest X-Ray',
    description: 'Post-viral cough follow-up. Lungs clear, no signs of congestion or inflammation.',
    metadata: { tags: ['Imaging', 'Diagnostics'] },
    createdAt: '2025-11-10T09:15:00Z',
    updatedAt: '2025-11-10T09:15:00Z',
    ledgerStatus: 'verified',
    txHash: '0x9c8b7a6d5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8'
  });

  store.set('RECORD_REC004', {
    docType: 'healthRecord',
    recordId: 'REC004',
    patientId: 'PAT001',
    doctorId: 'DOC003',
    doctorName: 'Dr. Chen',
    recordType: 'Diagnosis',
    title: 'Hypertension Screening',
    description: 'Blood pressure recorded at 135/85 mmHg. Recommended lifestyle modifications and low sodium diet.',
    metadata: { tags: ['Cardiology', 'Prevention'] },
    createdAt: '2025-05-22T16:45:00Z',
    updatedAt: '2025-05-22T16:45:00Z',
    ledgerStatus: 'verified',
    txHash: '0x4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5'
  });

  // VITALS SEEDING (Past 48 hours)
  const now = new Date();
  const vitals = [];
  for (let i = 0; i < 12; i++) {
      const time = new Date(now.getTime() - (i * 4 * 60 * 60 * 1000)).toISOString();
      const v = {
          id: `VIT00${i}`,
          patientId: 'PAT001',
          heartRate: 70 + Math.floor(Math.random() * 15),
          bloodPressure: {
              systolic: 110 + Math.floor(Math.random() * 30),
              diastolic: 70 + Math.floor(Math.random() * 20)
          },
          spO2: 96 + Math.floor(Math.random() * 4),
          temperature: (36.5 + (Math.random() * 1.5)).toFixed(1),
          timestamp: time,
          ledgerStatus: 'verified',
          txHash: `0x${Math.random().toString(16).slice(2)}...`
      };
      store.set(`VIT_${v.id}`, v);
      vitals.push(v.id);
  }
  
  const p = store.get('PATIENT_PAT001');
  if (p) p.vitalIds = vitals;
})();
}

// ── Connection Profile loader ─────────────────────────────────────────────────
function loadCCP() {
  const p = path.resolve(process.env.FABRIC_CONNECTION_PROFILE ||
    path.join(__dirname, 'connection-profile.json'));
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// ── Singleton Gateway Initializer ─────────────────────────────────────────────
async function getContract() {
  if (process.env.MOCK_FABRIC === 'true') return null;
  const ccp = loadCCP();
  if (!ccp) throw new Error('Fabric Connection Profile (connection-profile.json) not found. Cannot connect to Real Blockchain.');

  if (contract) return contract;

  try {
    const walletPath = path.join(__dirname, '../../wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const identityId = process.env.FABRIC_ADMIN_ID || 'admin';
    const identity = await wallet.get(identityId);
    if (!identity) {
      throw new Error(`Blockchain identity '${identityId}' not found in wallet. Ensure you have enrolled the admin.`);
    }

    gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: identityId,
      discovery: { enabled: false, asLocalhost: true },
    });

    network = await gateway.getNetwork(process.env.FABRIC_CHANNEL_NAME || 'mychannel');
    contract = network.getContract(process.env.FABRIC_CHAINCODE_NAME || 'ehr-chaincode');
    
    logger.info('⛓  Fabric Gateway Connected');
    return contract;
  } catch (err) {
    logger.error(`❌ Fabric Gateway Connection Failed: ${err.message}`);
    gateway = null;
    network = null;
    contract = null;
    throw err; // Throwing error instead of falling back to mock
  }
}

// ── Submit (write) transaction ────────────────────────────────────────────────
async function submitTransaction(fn, ...args) {
  const fabricContract = await getContract();
  if (!fabricContract) {
    // This only happens if MOCK_FABRIC is explicitly 'true'
    return mockInvoke(fn, args);
  }

  try {
    const result = await fabricContract.submitTransaction(fn, ...args.map(String));
    
    // Automatically notify of transaction confirmation
    // Note: In real scenarios, this might be handled by an event listener, but for 
    // the wrapper, we ensure the user gets feedback immediately.
    const patientId = args[0]; // Conventionally the first arg is the ID
    if (patientId && typeof patientId === 'string' && patientId.startsWith('PAT')) {
      notificationService.notify(patientId, {
        type: 'TRANSACTION_CONFIRMED',
        message: `Ledger Transaction Confirmed: ${fn} recorded on the blockchain.`,
        urgent: false
      });
    }

    return result.length > 0 ? JSON.parse(result.toString()) : { success: true };
  } catch (err) {
    throw new Error(extractMsg(err.message));
  }
}

// ── Evaluate (read) transaction ───────────────────────────────────────────────
async function evaluateTransaction(fn, ...args) {
  const fabricContract = await getContract();
  if (!fabricContract) {
    // This only happens if MOCK_FABRIC is explicitly 'true'
    return mockInvoke(fn, args);
  }

  try {
    const result = await fabricContract.evaluateTransaction(fn, ...args.map(String));
    return result.length > 0 ? JSON.parse(result.toString()) : null;
  } catch (err) {
    throw new Error(extractMsg(err.message));
  }
}

// ── Cleanup (export if needed for server shutdown) ───────────────────────────
async function disconnect() {
  if (gateway) {
    await gateway.disconnect();
    gateway = null;
    network = null;
    contract = null;
  }
}

function extractMsg(msg) {
  const m = msg.match(/message="([^"]+)"/);
  return m ? m[1] : msg;
}

// ── Mock mode implementation (mostly unchanged) ──────────────────────────────
function mockInvoke(fn, args) {
  logger.info(`[MOCK] Invoking ${fn} with args: ${JSON.stringify(args)}`);
  const ts = new Date().toISOString();
  // ... (rest of mockInvoke from original file)
  switch (fn) {
    case 'registerPatient': {
      const [patientId, name, dob, gender, bloodGroup, emergencyContact] = args;
      if (store.has(`PATIENT_${patientId}`)) throw new Error(`Patient ${patientId} already exists`);
      const p = { docType: 'patient', patientId, name, dob, gender, bloodGroup, emergencyContact, authorizedDoctors: [], recordIds: [], prescriptionIds: [], createdAt: ts, updatedAt: ts, active: true, version: 1 };
      store.set(`PATIENT_${patientId}`, p);
      return p;
    }
    case 'registerDoctor': {
      const [doctorId, name, specialization, licenseNumber, hospital] = args;
      if (store.has(`DOCTOR_${doctorId}`)) throw new Error(`Doctor ${doctorId} already exists`);
      const d = { docType: 'doctor', doctorId, name, specialization, licenseNumber, hospital, patientIds: [], createdAt: ts, updatedAt: ts, active: true, verified: false, version: 1 };
      store.set(`DOCTOR_${doctorId}`, d);
      return d;
    }
    case 'getPatient': {
      const p = store.get(`PATIENT_${args[0]}`);
      logger.info(`[MOCK] getPatient ${args[0]}: ${p ? 'FOUND' : 'NOT FOUND'}`);
      if (!p) throw new Error(`Patient ${args[0]} does not exist`);
      return p;
    }
    case 'getDoctor': {
      const d = store.get(`DOCTOR_${args[0]}`);
      if (!d) throw new Error(`Doctor ${args[0]} does not exist`);
      return d;
    }
    case 'grantDoctorAccess': {
      const [patientId, doctorId, expiresAt] = args;
      const p = store.get(`PATIENT_${patientId}`);
      if (!p) throw new Error(`Patient ${patientId} not found`);
      const idx = p.authorizedDoctors.findIndex(a => a.doctorId === doctorId);
      const entry = { doctorId, grantedAt: ts, expiresAt: expiresAt || null, active: true };
      if (idx >= 0) p.authorizedDoctors[idx] = entry; else p.authorizedDoctors.push(entry);
      
      notificationService.notify(patientId, {
        type: 'CONSENT_REQUEST',
        message: `Identity access granted/updated for Doctor: ${doctorId}`,
        urgent: true
      });

      return { success: true, patientId, doctorId };
    }
    case 'revokeDoctorAccess': {
      const [patientId, doctorId] = args;
      const p = store.get(`PATIENT_${patientId}`);
      if (p) { const a = p.authorizedDoctors.find(x => x.doctorId === doctorId); if (a) { a.active = false; a.revokedAt = ts; } }
      return { success: true };
    }
    case 'createHealthRecord': {
      const [recordId, patientId, doctorId, ipfsHash, recordType, description, metadataStr] = args;
      if (store.has(`RECORD_${recordId}`)) throw new Error(`Record ${recordId} already exists`);
      const r = { docType: 'healthRecord', recordId, patientId, doctorId, ipfsHash, recordType, description, metadata: JSON.parse(metadataStr || '{}'), createdAt: ts, updatedAt: ts, active: true, version: 1 };
      store.set(`RECORD_${recordId}`, r);
      const p = store.get(`PATIENT_${patientId}`);
      if (p) p.recordIds.push(recordId);
      
      notificationService.notify(patientId, {
        type: 'LAB_RESULT',
        message: `New medical record uploaded: ${recordType}`,
        urgent: true
      });

      return r;
    }
    case 'getHealthRecord': {
      const r = store.get(`RECORD_${args[0]}`);
      if (!r) throw new Error(`Record ${args[0]} does not exist`);
      return r;
    }
    case 'getPatientRecords': {
      const p = store.get(`PATIENT_${args[0]}`);
      logger.info(`[MOCK] getPatientRecords for ${args[0]}: ${p ? (p.recordIds || []).length : 'NO PATIENT'}`);
      if (!p) return [];
      return (p.recordIds || []).map(id => store.get(`RECORD_${id}`)).filter(Boolean);
    }
    case 'createPrescription': {
      const [prescriptionId, patientId, doctorId, medicationsStr, instructions, validUntil] = args;
      if (store.has(`PRESCRIPTION_${prescriptionId}`)) throw new Error(`Prescription ${prescriptionId} already exists`);
      const rx = { docType: 'prescription', prescriptionId, patientId, doctorId, medications: JSON.parse(medicationsStr), instructions, validUntil, status: 'ACTIVE', dispensedAt: null, dispensedBy: null, createdAt: ts, updatedAt: ts, version: 1 };
      store.set(`PRESCRIPTION_${prescriptionId}`, rx);
      const p = store.get(`PATIENT_${patientId}`);
      if (p) { p.prescriptionIds = p.prescriptionIds || []; p.prescriptionIds.push(prescriptionId); }
      
      notificationService.notify(patientId, {
        type: 'PRESCRIPTION',
        message: `New prescription issued for ${JSON.parse(medicationsStr)[0]?.name || 'medication'}`,
        urgent: true
      });

      return rx;
    }
    case 'getPrescription': {
      const rx = store.get(`PRESCRIPTION_${args[0]}`);
      if (!rx) throw new Error(`Prescription ${args[0]} does not exist`);
      return rx;
    }
    case 'getPatientPrescriptions': {
      const p = store.get(`PATIENT_${args[0]}`);
      if (!p) return [];
      return (p.prescriptionIds || []).map(id => store.get(`PRESCRIPTION_${id}`)).filter(Boolean);
    }
    case 'dispensePrescription': {
      const rx = store.get(`PRESCRIPTION_${args[0]}`);
      if (!rx) throw new Error(`Prescription ${args[0]} does not exist`);
      if (rx.status !== 'ACTIVE') throw new Error(`Prescription is ${rx.status}`);
      rx.status = 'DISPENSED'; rx.dispensedAt = ts; rx.dispensedBy = args[1]; rx.version += 1;
      return rx;
    }
    case 'getDoctorPatients': {
      const doctorId = args[0];
      const patients = [...store.values()]
        .filter(v => v.docType === 'patient' && v.authorizedDoctors && v.authorizedDoctors.some(a => a.doctorId === doctorId && a.active))
        .map(p => ({
          patientId: p.patientId,
          name: p.name,
          dob: p.dob,
          gender: p.gender,
          bloodGroup: p.bloodGroup,
          grantedAt: p.authorizedDoctors.find(a => a.doctorId === doctorId)?.grantedAt
        }));
      logger.info(`[MOCK] getDoctorPatients for ${doctorId}: Found ${patients.length}`);
      return patients;
    }
    case 'queryRecordsByDoctor': {
      const doctorId = args[0];
      const records = [...store.values()]
        .filter(v => v.docType === 'healthRecord' && v.doctorId === doctorId);
      logger.info(`[MOCK] queryRecordsByDoctor for ${doctorId}: Found ${records.length}`);
      return records;
    }
    case 'getRecordHistory': {
      const recordId = args[0];
      const r = store.get(`RECORD_${recordId}`);
      if (!r) throw new Error(`Record ${recordId} not found`);
      return [
        { txId: 'tx1', value: r, timestamp: r.createdAt, isDelete: false },
        { txId: 'tx2', value: { ...r, status: 'ACCESSED' }, timestamp: ts, isDelete: false }
      ];
    }
    case 'queryAllPatients':
      return [...store.values()].filter(v => v.docType === 'patient');
    case 'queryAllDoctors':
      return [...store.values()].filter(v => v.docType === 'doctor');
    case 'getAuditTrail': {
      const entityId = args[0] || 'all';
      return [
        { timestamp: ts, action: 'LOGIN', user: entityId, details: 'User logged into the system' },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'QUERY', user: entityId, details: 'Accessed patient records' },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), action: 'UPDATE', user: entityId, details: 'Modified contact information' }
      ];
    }
    case 'verifyDoctor': {
      const d = store.get(`DOCTOR_${args[0]}`);
      if (!d) throw new Error(`Doctor ${args[0]} not found`);
      d.verified = true; d.verifiedAt = ts; d.version += 1;
      return d;
    }
    case 'createAppointment': {
      const [appointmentId, patientId, doctorId, date, time, reason, status] = args;
      const appt = { docType: 'appointment', appointmentId, patientId, doctorId, date, time, reason, status: status || 'SCHEDULED', createdAt: ts, updatedAt: ts };
      store.set(`APPO_${appointmentId}`, appt);
      const p = store.get(`PATIENT_${patientId}`);
      if (p) { p.appointmentIds = p.appointmentIds || []; p.appointmentIds.push(appointmentId); }
      
      notificationService.notify(patientId, {
        type: 'APPOINTMENT_CONFIRMED',
        message: `New appointment scheduled: ${reason} on ${date} at ${time}`,
        urgent: false
      });

      return appt;
    }
    case 'getPatientAppointments': {
      const p = store.get(`PATIENT_${args[0]}`);
      logger.info(`[MOCK] getPatientAppointments for ${args[0]}: ${p ? (p.appointmentIds || []).length : 'NO PATIENT'}`);
      if (!p) return [];
      return (p.appointmentIds || []).map(id => store.get(`APPO_${id}`)).filter(Boolean);
    }
    case 'createBillingRecord': {
      const [billId, patientId, amount, description, status, dueDate] = args;
      const bill = { docType: 'billing', billId, patientId, amount, description, status: status || 'PENDING', dueDate, createdAt: ts };
      store.set(`BILL_${billId}`, bill);
      const p = store.get(`PATIENT_${patientId}`);
      if (p) { p.billingIds = p.billingIds || []; p.billingIds.push(billId); }
      
      notificationService.notify(patientId, {
        type: 'BILLING',
        message: `New invoice generated: ${description} ($${amount})`,
        urgent: false
      });

      return bill;
    }
    case 'getPatientBilling': {
      const p = store.get(`PATIENT_${args[0]}`);
      logger.info(`[MOCK] getPatientBilling for ${args[0]}: ${p ? (p.billingIds || []).length : 'NO PATIENT'}`);
      if (!p) return [];
      return (p.billingIds || []).map(id => store.get(`BILL_${id}`)).filter(Boolean);
    }
    case 'getPatientVitals': {
      const p = store.get(`PATIENT_${args[0]}`);
      if (!p) return [];
      return (p.vitalIds || []).map(id => store.get(`VIT_${id}`)).filter(Boolean);
    }
    default:
      logger.warn(`[MOCK] Unknown function: ${fn}`);
      return { success: true, mock: true };
  }
}

async function getFabricStatus() {
  if (process.env.MOCK_FABRIC === 'true') return { status: 'mock', mode: 'development', node: 'local-emulator' };
  const ccp = loadCCP();
  if (!ccp) return { status: 'offline', mode: 'none', reason: 'No connection profile' };
  
  const fabricContract = await getContract().catch(() => null);
  if (!fabricContract) {
    if (process.env.MOCK_FABRIC === 'true') {
        return { status: 'mock', mode: 'development', node: 'local-emulator' };
    }
    return { status: 'offline', mode: 'none', reason: 'Fabric Gateway Unavailable' };
  }
  
  return { 
    status: 'online', 
    mode: 'production', 
    node: 'peer0.org1.example.com',
    channel: process.env.FABRIC_CHANNEL_NAME || 'mychannel',
    chaincode: process.env.FABRIC_CHAINCODE_NAME || 'ehr-chaincode'
  };
}

function __resetMockStore() {
  store.clear();
  mockIdCounter = 1000;
  logger.info('[MOCK] Store reset for testing');
}

module.exports = { submitTransaction, evaluateTransaction, disconnect, getFabricStatus, __resetMockStore };
