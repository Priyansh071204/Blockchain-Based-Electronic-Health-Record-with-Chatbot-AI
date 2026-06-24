import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEHR } from '../hooks/useEHR';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import { 
  PlusCircle, 
  SquarePlus, 
  History as HistoryIcon, 
  Filter,
  Stethoscope,
  Clock
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import './DoctorDashboard.css';

const DoctorDashboard: React.FC = () => {
  const ehr = useEHR();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const triageDistribution = [
    { name: 'Stable', value: 12, color: '#10b981' },
    { name: 'Observation', value: 5, color: '#a855f7' },
    { name: 'Consultation', value: 8, color: '#00f2ff' },
    { name: 'Urgent', value: 2, color: '#ef4444' }
  ];

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await ehr.getMyPatients();
        setPatients(res.data || []);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
      }
    };
    fetchPatients();
  }, []);

  const filteredTriage = patients.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.patientId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PageTransition>
      <div className="dashboard-page doctor-friendly-page">
        <motion.header 
          className="doctor-hero"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div>
            <div className="doctor-hero-meta">
              <span className="care-pill care-pill-success pulse-lume">Verified doctor</span>
              <span className="doctor-eyebrow">{user?.name ? `Dr. ${user.name}` : 'Care workspace'}</span>
            </div>
            <h1>Today's patient workspace</h1>
            <p className="text-dim">Find patients quickly, review their status, and create care notes without digging through technical details.</p>
          </div>
          <div className="doctor-hero-actions">
            <motion.button 
              className="btn-lume" 
              onClick={() => navigate('/doctor/records/new')}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusCircle size={16} />
              <span>New note</span>
            </motion.button>
          </div>
        </motion.header>

        <div className="doctor-grid">
          {/* Analytics & Triage Stats */}
          <motion.div 
            className="analytics-panel"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div 
              className="lume-panel queue-card flare-card"
              variants={item}
              whileHover={{ y: -5, boxShadow: 'var(--shadow-lume)' }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
            >
              <span className="metric-label">Patient mix</span>
              <div className="chart-container" style={{ height: '220px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={100}>
                  <PieChart>
                    <Pie
                      data={triageDistribution}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {triageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-thin)', borderRadius: 'var(--radius-md)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="queue-stats">
                <div className="queue-stat-item">
                  <span className="metric-label" style={{ fontSize: '0.55rem' }}>Average wait</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem' }}>12.5m</span>
                </div>
                <div className="queue-stat-item">
                  <span className="metric-label" style={{ fontSize: '0.55rem' }}>Needs attention</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ef4444' }}>2 active</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lume-panel doctor-status-card"
              variants={item}
              whileHover={{ scale: 1.02 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="metric-label" style={{ fontSize: '0.55rem' }}>Care team status</span>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>Ready for appointments</div>
                </div>
                <div className="metric-icon-box" style={{ color: 'var(--lume-cyan)', borderColor: 'var(--lume-cyan)' }}>
                  <Stethoscope size={18} />
                </div>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <div className="pulse-dot"></div>
                Patient data synced
              </div>
            </motion.div>
          </motion.div>

          {/* Patient Triage Terminal */}
          <div className="doctor-main-stack">
            <motion.div 
              className="search-console"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient name or ID..."
                />
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', borderLeft: '1px solid var(--border-thin)' }}>
                  <Filter size={18} className="text-dim" />
                </div>
            </motion.div>

            <motion.div 
              className="lume-panel overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <header className="doctor-panel-heading">
                <span className="metric-label">My patients</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="pulse-dot"></span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>Updated now</span>
                </div>
              </header>

              <div className="table-wrapper">
                <table className="triage-table">
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Last update</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTriage.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="empty-state-row">No patients match this search. Clear the filter or check assigned patients later.</div>
                        </td>
                      </tr>
                    )}
                    {filteredTriage.map((p, i) => (
                      <motion.tr 
                        key={p.id || p.patientId || p.email || `patient-${i}`} 
                        className="triage-row"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + (i * 0.05) }}
                        whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        <td><span className="id-badge">{p.patientId || p.id}</span></td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</span>
                        </td>
                        <td>
                          <span className={`badge-status ${p.verified ? 'session' : 'waiting'}`}>
                            {p.verified ? 'Ready' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                            <Clock size={12} />
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{p.updatedAt ? new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <motion.button 
                              className="btn-action" 
                              title="Add care note"
                              whileHover={{ scale: 1.1, color: 'var(--lume-cyan)' }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => navigate('/doctor/records/new', { state: { patientId: p.patientId || p.id } })}
                              type="button"
                            >
                              <SquarePlus size={16} />
                            </motion.button>
                            <motion.button 
                              className="btn-action" 
                              title="View history"
                              whileHover={{ scale: 1.1, color: 'var(--lume-cyan)' }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => navigate('/doctor/records', { state: { patientId: p.patientId || p.id } })}
                              type="button"
                            >
                              <HistoryIcon size={16} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DoctorDashboard;
