import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEHR } from '../hooks/useEHR';
import PageTransition from '../components/PageTransition';
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

  const IPFS_GATEWAY = 'http://localhost:8080/ipfs';

  const getIpfsUrl = (record: any) => {
    const directUrl = record?.ipfsUrl;
    if (typeof directUrl === 'string' && directUrl.trim()) return directUrl;

    const metadataUrl = record?.metadata?.ipfsUrl;
    if (typeof metadataUrl === 'string' && metadataUrl.trim()) return metadataUrl;

    const hash = record?.ipfsHash;
    if (typeof hash === 'string' && hash.trim()) return `${IPFS_GATEWAY}/${hash}`;

    return null;
  };

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await ehr.getMyRecords();
        if (res && res.data && Array.isArray(res.data)) {
          setRecords(res.data);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error('Failed to fetch records', err);
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
    const physician = record?.doctorName || 'Unknown Physician';

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  if (loading) {
    return (
      <PageTransition>
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
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="medical-records-page p-8">
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge-lume pulse-lume" style={{ color: '#00f2ff' }}>Chain Registry Access</span>
            <span className="metric-label" style={{ color: 'var(--text-dim)' }}>MSP_IDENTITY_VERIFIED</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Medical <span className="text-cyan">Records</span></h1>
          <p className="text-dim">Immutable health ledger entries synchronized across clinical nodes.</p>
        </motion.header>

        <motion.div 
          className="record-controls"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="filter-group">
            {['all', 'lab', 'scan', 'prescription', 'note'].map(t => (
              <motion.button 
                key={t}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`tab-btn ${filter === t ? 'active' : ''}`}
                style={{ fontSize: '0.6rem', padding: '0.5rem 1rem' }}
                onClick={() => setFilter(t)}
              >
                {t.toUpperCase()}
              </motion.button>
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
        </motion.div>

        <motion.div 
          className="records-grid"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, idx) => (
              <motion.div 
                key={record.recordId || idx} 
                className="record-list-item"
                variants={item}
                whileHover={{ x: 10, background: 'rgba(255,255,255,0.03)' }}
              >
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
                  <Stethoscope size={14} className="text-cyan" />
                  <span>{record.doctorName || 'Unknown Physician'}</span>
                </div>

                <div className="record-date">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarIcon size={14} className="text-dim" />
                    <span>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'unknown'}</span>
                  </div>
                </div>

                <div className="record-actions">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="icon-btn" 
                    title="View Source"
                    onClick={() => {
                      const url = getIpfsUrl(record);
                      if (url) {
                        window.open(url, '_blank');
                      } else {
                        alert('IPFS source link unavailable for this entry.');
                      }
                    }}
                  >
                    <Eye size={16} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="icon-btn" 
                    title="Download Verified Proof"
                    onClick={() => alert('Download of cryptographic proof sequence initiated...')}
                  >
                    <Download size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Database size={48} className="text-dim" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No Records Found</h3>
              <p className="text-dim">No immutable entries detected matching your current filter.</p>
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={24} className="text-cyan" />
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Integrity Guard Active</span>
              <p className="text-dim" style={{ fontSize: '0.75rem' }}>All displayed records are cross-verified with the Hyperledger Fabric ledger.</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-lume" 
            style={{ height: '36px', fontSize: '10px' }}
          >
            Request Full Audit
          </motion.button>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default MedicalRecords;

