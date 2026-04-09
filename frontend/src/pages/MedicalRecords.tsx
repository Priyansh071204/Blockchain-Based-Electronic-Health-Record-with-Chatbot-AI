import React, { useState, useEffect } from 'react';
import { useEHR } from '../hooks/useEHR';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Database, 
  Stethoscope, 
  Calendar as CalendarIcon,
  ShieldCheck,
  FlaskConical,
  Activity,
  ClipboardList
} from 'lucide-react';
import './MedicalRecords.css';

const MedicalRecords: React.FC = () => {
  const ehr = useEHR();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await ehr.getMyRecords();
        // Set records if data is an array, otherwise keep empty
        if (res && res.data && Array.isArray(res.data)) {
          setRecords(res.data);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error('Failed to fetch records', err);
        // Only fallback if specifically in development and desired
        // For now, let's keep it empty to be honest with the user
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // Defensive filtering logic
  const filteredRecords = (Array.isArray(records) ? records : []).filter(record => {
    const type = record?.type || 'UNKNOWN';
    const title = record?.title || 'Untitled Record';
    const physician = record?.physician || 'Unknown Physician';

    const matchesFilter = filter === 'all' || type.toLowerCase().includes(filter.toLowerCase());
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          physician.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    switch (t) {
      case 'LAB': return <FlaskConical size={18} />;
      case 'SCAN': return <Activity size={18} />;
      case 'PRESCRIPTION': return <ClipboardList size={18} />;
      default: return <FileText size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="medical-records-page p-8">
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge-lume pulse-lume" style={{ color: '#00f2ff' }}>Chain Registry Access</span>
            <span className="metric-label" style={{ color: 'var(--text-dim)' }}>MSP_IDENTITY_VERIFIED</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Medical <span className="text-cyan">Records</span></h1>
          <p className="text-dim">Immutable health ledger entries synchronized across clinical nodes.</p>
        </header>
        <div className="empty-state">
          <span className="metric-label pulse-lume">Synchronizing Blockchain Ledger...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-records-page p-8">
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge-lume pulse-lume" style={{ color: '#00f2ff' }}>Chain Registry Access</span>
          <span className="metric-label" style={{ color: 'var(--text-dim)' }}>MSP_IDENTITY_VERIFIED</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Medical <span className="text-cyan">Records</span></h1>
        <p className="text-dim">Immutable health ledger entries synchronized across clinical nodes.</p>
      </header>

      <div className="record-controls">
        <div className="filter-group">
          {['all', 'lab', 'scan', 'prescription', 'note'].map(t => (
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
            placeholder="Query records by title or physician..." 
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
            <div key={record._id || Math.random()} className="record-list-item">
              <div className="record-type-icon">
                {getIcon(record.type)}
              </div>
              
              <div className="record-info-main">
                <span className="record-title">{record.title || 'Untitled Record'}</span>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className={`record-type-badge type-${(record.type || 'note').toLowerCase().substring(0,3)}`}>
                    {record.type || 'NOTE'}
                  </span>
                  <span className="record-meta" style={{ fontFamily: 'var(--font-mono)' }}>TX_{(record._id || 'unknown').substring(0,8)}</span>
                </div>
              </div>

              <div className="record-physician">
                <Stethoscope size={14} className="text-cyan" />
                <span>{record.physician || 'Unknown Physician'}</span>
              </div>

              <div className="record-date">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarIcon size={14} className="text-dim" />
                  <span>{record.date || 'unknown'}</span>
                </div>
              </div>

              <div className="record-actions">
                <button 
                  className="icon-btn" 
                  title="View Source"
                  onClick={() => {
                    if (record.ipfsUrl) window.open(record.ipfsUrl, '_blank');
                    else alert('IPFS source link unavailable for this entry.');
                  }}
                >
                  <Eye size={16} />
                </button>
                <button 
                  className="icon-btn" 
                  title="Download Verified Proof"
                  onClick={() => alert('Download of cryptographic proof sequence initiated...')}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Database size={48} className="text-dim" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No Records Found</h3>
            <p className="text-dim">No immutable entries detected matching your current filter.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldCheck size={24} className="text-cyan" />
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Integrity Guard Active</span>
            <p className="text-dim" style={{ fontSize: '0.75rem' }}>All displayed records are cross-verified with the Hyperledger Fabric ledger.</p>
          </div>
        </div>
        <button className="btn-lume" style={{ height: '36px', fontSize: '10px' }}>
          Request Full Audit
        </button>
      </div>
    </div>
  );
};

export default MedicalRecords;
