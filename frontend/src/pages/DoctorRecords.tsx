import React, { useState, useEffect } from 'react';
import { useEHR } from '../hooks/useEHR';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Database, 
  Calendar as CalendarIcon,
  ShieldCheck,
  FlaskConical,
  Activity,
  ClipboardList,
  User as UserIcon
} from 'lucide-react';
import './MedicalRecords.css'; // Reuse the same styles

const DoctorRecords: React.FC = () => {
  const ehr = useEHR();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Use a constant for IPFS gateway to avoid 'process' issues in some browsers/bundlers
  const IPFS_GATEWAY = 'http://localhost:8080/ipfs';

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await ehr.getDoctorAuthoredRecords();
        if (res && res.data && Array.isArray(res.data)) {
          setRecords(res.data);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error('Failed to fetch authored records', err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = (Array.isArray(records) ? records : []).filter(record => {
    const type = record?.recordType || 'UNKNOWN';
    const title = record?.description || 'Untitled Record';
    const patientId = record?.patientId || 'Unknown Patient';

    const matchesFilter = filter === 'all' || type.toLowerCase().includes(filter.toLowerCase());
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          patientId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('LAB')) return <FlaskConical size={18} />;
    if (t.includes('IMAGING') || t.includes('SCAN')) return <Activity size={18} />;
    if (t.includes('PRESCRIPTION')) return <ClipboardList size={18} />;
    return <FileText size={18} />;
  };

  if (loading) {
    return (
      <div className="medical-records-page p-8">
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge-lume pulse-lume" style={{ color: '#00f2ff' }}>Doctor Audit Console</span>
            <span className="metric-label" style={{ color: 'var(--text-dim)' }}>AUTH_RECORDS_INDEXING</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Authored <span className="text-cyan">Records</span></h1>
          <p className="text-dim">History of clinical entries issued by you across the blockchain network.</p>
        </header>
        <div className="empty-state">
          <span className="metric-label pulse-lume">Retrieving Author Attribution Logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-records-page p-8">
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge-lume pulse-lume" style={{ color: '#00f2ff' }}>Doctor Audit Console</span>
          <span className="metric-label" style={{ color: 'var(--text-dim)' }}>MSP_VERIFIED_AUTHOR</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Authored <span className="text-cyan">Records</span></h1>
        <p className="text-dim">History of clinical entries issued by you across the blockchain network.</p>
      </header>

      <div className="record-controls">
        <div className="filter-group">
          {['all', 'lab', 'imaging', 'prescription', 'consultation'].map(t => (
            <button 
              key={t}
              className={`tab-btn ${filter === t ? 'active' : ''}`}
              style={{ fontSize: '0.6rem', padding: '0.5rem 1rem' }}
              onClick={() => setFilter(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="search-console" style={{ width: '400px', height: '44px' }}>
          <input 
            type="text" 
            placeholder="Filter by description or Patient ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
            <Search size={16} className="text-dim" />
          </div>
        </div>
      </div>

      <div className="records-grid">
        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => (
            <div key={record.recordId || Math.random()} className="record-list-item">
              <div className="record-type-icon">
                {getIcon(record.recordType)}
              </div>
              
              <div className="record-info-main">
                <span className="record-title">{record.description || 'Untitled Record'}</span>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className={`record-type-badge type-${(record.recordType || 'note').toLowerCase().substring(0,3)}`}>
                    {record.recordType || 'NOTE'}
                  </span>
                  <span className="record-meta" style={{ fontFamily: 'var(--font-mono)' }}>TX_{(record.recordId || 'unknown').substring(0,8)}</span>
                </div>
              </div>

              <div className="record-physician">
                <UserIcon size={14} className="text-cyan" />
                <span>Patient: {record.patientId || 'Unknown'}</span>
              </div>

              <div className="record-date">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarIcon size={14} className="text-dim" />
                  <span>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'unknown'}</span>
                </div>
              </div>

              <div className="record-actions">
                <button 
                  className="icon-btn" 
                  title="View Source"
                  onClick={() => {
                    const url = record.metadata?.ipfsUrl || `${IPFS_GATEWAY}/${record.ipfsHash}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Eye size={16} />
                </button>
                <button className="icon-btn" title="Download Verified Proof">
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Database size={48} className="text-dim" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No Authored Records Found</h3>
            <p className="text-dim">You have not issued any clinical records onto the blockchain ledger yet.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldCheck size={24} className="text-cyan" />
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Blockchain Attribution Verified</span>
            <p className="text-dim" style={{ fontSize: '0.75rem' }}>Every record above is cryptographically signed and attributed to your clinical MSP identity.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRecords;
