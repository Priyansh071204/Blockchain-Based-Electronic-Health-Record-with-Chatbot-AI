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

  const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'http://localhost:8080/ipfs';

  const getIpfsUrl = (record: any) => {
    const metadataUrl = record?.metadata?.ipfsUrl;
    if (typeof metadataUrl === 'string' && metadataUrl.trim()) return metadataUrl;

    const hash = record?.ipfsHash;
    if (typeof hash === 'string' && hash.trim()) return `${IPFS_GATEWAY}/${hash}`;

    return null;
  };

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
            <span className="badge-lume pulse-lume" style={{ color: '#00f2ff' }}>Doctor Audit Console</span>
            <span className="metric-label" style={{ color: 'var(--text-dim)' }}>MSP_VERIFIED_AUTHOR</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Authored <span className="text-cyan">Records</span></h1>
          <p className="text-dim">History of clinical entries issued by you across the blockchain network.</p>
        </motion.header>

        <motion.div 
          className="record-controls"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="filter-group">
            {['all', 'lab', 'imaging', 'prescription', 'consultation'].map(t => (
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
              placeholder="Filter by description or Patient ID..." 
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
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No Authored Records Found</h3>
              <p className="text-dim">You have not issued any clinical records onto the blockchain ledger yet.</p>
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={24} className="text-cyan" />
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Blockchain Attribution Verified</span>
              <p className="text-dim" style={{ fontSize: '0.75rem' }}>Every record above is cryptographically signed and attributed to your clinical MSP identity.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default DoctorRecords;

