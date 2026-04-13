import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEHR } from '../hooks/useEHR';
import PageTransition from '../components/PageTransition';
import { 
  FilePlus, 
  Upload, 
  User, 
  Search, 
  ShieldCheck, 
  FileText, 
  CheckCircle,
  AlertCircle,
  X,
  Database
} from 'lucide-react';
import './NewRecord.css';

const NewRecord: React.FC = () => {
  const ehr = useEHR();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [patientId, setPatientId] = useState('');

  useEffect(() => {
    if (location.state && (location.state as any).patientId) {
      setPatientId((location.state as any).patientId);
    }
  }, [location]);
  
  const [recordType, setRecordType] = useState('Laboratory Report');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !patientId) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('recordType', recordType);
      formData.append('diagnosis', diagnosis);
      formData.append('notes', notes);

      await ehr.createRecord(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPatientId('');
        setDiagnosis('');
        setNotes('');
        setFile(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to create record', err);
      alert('Failed to commit record to ledger. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <PageTransition>
      <div className="new-record-page p-8">
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge-lume pulse-lume" style={{ color: '#00f2ff' }}>Identity Context Active</span>
            <span className="metric-label" style={{ color: 'var(--text-dim)' }}>LEDGER_WRITE_ACCESS_AUTHORIZED</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Enroll New <span className="text-cyan">Record</span></h1>
          <p className="text-dim">Provision immutable health data to the patient's distributed vault.</p>
        </motion.header>

        <motion.div 
          className="lume-panel" 
          style={{ padding: '2.5rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            <div className="record-form-grid">
              <div className="form-main-content">
                <div className="form-section-label">Subject Identification</div>
                <div className="identity-select">
                  <div className="identity-input-wrapper">
                    <User size={18} className="identity-icon" />
                    <input 
                      className="identity-input"
                      placeholder="Enter Patient Identity Hash (e.g. PAT-12345)"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      required
                    />
                    <div style={{ position: 'absolute', right: '1rem' }}>
                      <Search size={16} className="text-dim" />
                    </div>
                  </div>
                  <AnimatePresence>
                    {patientId.length > 3 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="patient-preview-card"
                      >
                        <div className="preview-avatar">{patientId.substring(4, 6).toUpperCase() || 'P'}</div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Verified Subject Detected
                          </span>
                          <p className="text-dim" style={{ fontSize: '0.7rem' }}>MSP_ID: {patientId}_AUTH_NODE_01</p>
                        </div>
                        <ShieldCheck size={16} className="text-cyan" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="form-section-label">Record Metadata</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="input-field">
                    <label className="metric-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Record Category</label>
                    <select 
                      className="lume-input"
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                    >
                      <option>Laboratory Report</option>
                      <option>Radiology Scan (MRI/CT)</option>
                      <option>Surgical Summary</option>
                      <option>Prescription Protocol</option>
                      <option>Diagnostic Note</option>
                    </select>
                  </div>
                  <div className="input-field">
                    <label className="metric-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Primary Diagnosis</label>
                    <input 
                      className="lume-input"
                      placeholder="e.g. Chronic Hypertension"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-field" style={{ marginBottom: '2rem' }}>
                  <label className="metric-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Clinical Narrative</label>
                  <textarea 
                    className="lume-input"
                    rows={4}
                    placeholder="Summarize the findings for the immutable ledger..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="integrity-check">
                  <div className="form-section-label" style={{ border: 'none', marginBottom: '0.5rem' }}>Encryption Proof</div>
                  <div className="integrity-item">
                    <span className="integrity-label">Encryption Algorithm</span>
                    <span className="integrity-value">AES_256_GCM</span>
                  </div>
                  <div className="integrity-item">
                    <span className="integrity-label">MSP Signing Protocol</span>
                    <span className="integrity-value">ECDSA_SECP256K1</span>
                  </div>
                </div>
              </div>

              <div className="form-side-content">
                <div className="form-section-label">Data Payload</div>
                <motion.div 
                  whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.03)' }}
                  whileTap={{ scale: 0.98 }}
                  className="dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <AnimatePresence mode="wait">
                    {!file ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'center' }}
                      >
                        <div className="dropzone-icon">
                          <Upload size={24} />
                        </div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Select File</div>
                        <p className="text-dim" style={{ fontSize: '0.7rem' }}>PDF, DICOM, or JPG (Max 50MB)</p>
                        <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sharp)', fontSize: '0.6rem', border: '1px solid var(--border-thin)', color: 'var(--text-dim)' }}>
                          SECURE_CHANNEL_UPLOAD
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="selected"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{ textAlign: 'center', width: '100%' }}
                      >
                        <div className="dropzone-icon" style={{ borderColor: 'var(--lume-cyan)', color: 'var(--lume-cyan)' }}>
                          <FileText size={24} />
                        </div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {file.name}
                        </div>
                        <p className="text-dim" style={{ fontSize: '0.7rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <motion.button 
                          whileHover={{ scale: 1.1, color: 'var(--danger)' }}
                          className="icon-btn"
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          style={{ marginTop: '0.5rem' }}
                        >
                          <X size={14} />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <div style={{ marginTop: '2rem' }}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-lume" 
                    style={{ width: '100%', height: '56px' }}
                    disabled={isSubmitting || !file || !patientId}
                    type="submit"
                  >
                    <AnimatePresence mode="wait">
                      {isSubmitting ? (
                        <motion.div 
                          key="submitting"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                        >
                          <Database size={18} className="pulse-lume" />
                          <span>COMMITTING...</span>
                        </motion.div>
                      ) : success ? (
                        <motion.div 
                          key="success"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981' }}
                        >
                          <CheckCircle size={18} />
                          <span>BLOCK COMMITTED</span>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                        >
                          <FilePlus size={18} />
                          <span>INITIALIZE PROVISION</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <p className="text-dim" style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '1rem' }}>
                    By initializing, you digitally sign this record as a verified medical professional.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-dim)' }}
        >
          <AlertCircle size={16} />
          <span className="metric-label" style={{ fontSize: '0.65rem' }}>Records once committed cannot be deleted, but can be version-managed on the ledger.</span>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default NewRecord;

