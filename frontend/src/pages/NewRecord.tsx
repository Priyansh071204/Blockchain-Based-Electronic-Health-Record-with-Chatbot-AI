import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEHR } from '../hooks/useEHR';
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
      // Reset form after 2 seconds
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
    <div className="new-record-page p-8">
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge-lume pulse-lume" style={{ color: '#00f2ff' }}>Identity Context Active</span>
          <span className="metric-label" style={{ color: 'var(--text-dim)' }}>LEDGER_WRITE_ACCESS_AUTHORIZED</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Enroll New <span className="text-cyan">Record</span></h1>
        <p className="text-dim">Provision immutable health data to the patient's distributed vault.</p>
      </header>

      <div className="lume-panel" style={{ padding: '2.5rem' }}>
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
                {patientId.length > 3 && (
                  <div className="patient-preview-card">
                    <div className="preview-avatar">{patientId.substring(4, 6).toUpperCase() || 'P'}</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Verified Subject Detected
                      </span>
                      <p className="text-dim" style={{ fontSize: '0.7rem' }}>MSP_ID: {patientId}_AUTH_NODE_01</p>
                    </div>
                    <ShieldCheck size={16} className="text-cyan" />
                  </div>
                )}
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
              <div 
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                {!file ? (
                  <>
                    <div className="dropzone-icon">
                      <Upload size={24} />
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Select File</div>
                    <p className="text-dim" style={{ fontSize: '0.7rem' }}>PDF, DICOM, or JPG (Max 50MB)</p>
                    <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sharp)', fontSize: '0.6rem', border: '1px solid var(--border-thin)', color: 'var(--text-dim)' }}>
                      SECURE_CHANNEL_UPLOAD
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dropzone-icon" style={{ borderColor: 'var(--lume-cyan)', color: 'var(--lume-cyan)' }}>
                      <FileText size={24} />
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.name}
                    </div>
                    <p className="text-dim" style={{ fontSize: '0.7rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      className="icon-btn"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{ marginTop: '0.5rem' }}
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button 
                  className="btn-lume" 
                  style={{ width: '100%', height: '56px' }}
                  disabled={isSubmitting || !file || !patientId}
                  type="submit"
                >
                  {isSubmitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Database size={18} className="pulse-lume" />
                      <span>COMMITTING...</span>
                    </div>
                  ) : success ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981' }}>
                      <CheckCircle size={18} />
                      <span>BLOCK COMMITTED</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FilePlus size={18} />
                      <span>INITIALIZE PROVISION</span>
                    </div>
                  )}
                </button>
                <p className="text-dim" style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '1rem' }}>
                  By initializing, you digitally sign this record as a verified medical professional.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-dim)' }}>
        <AlertCircle size={16} />
        <span className="metric-label" style={{ fontSize: '0.65rem' }}>Records once committed cannot be deleted, but can be version-managed on the ledger.</span>
      </div>
    </div>
  );
};

export default NewRecord;
