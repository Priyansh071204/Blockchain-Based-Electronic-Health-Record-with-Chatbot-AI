import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEHR } from '../hooks/useEHR';
import PageTransition from '../components/PageTransition';
import { 
  RefreshCw, 
  Settings, 
  ShieldCheck, 
  FileText, 
  Key, 
  Clock, 
  Shield, 
  Cpu, 
  CheckCircle2,
  Activity,
  UserCheck,
  Users
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const ehr = useEHR();
  const location = useLocation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'patients' | 'doctors'>('doctors');

  // Sync tab with URL
  useEffect(() => {
    if (location.pathname.includes('/admin/patients')) {
      setActiveTab('patients');
    } else {
      setActiveTab('doctors');
    }
  }, [location.pathname]);
  
  const [networkMetrics, setNetworkMetrics] = useState({
    nodes: 4,
    latency: '24ms',
    uptime: '99.98%',
    blocks: 4120
  });

  const transactionData = [
    { name: '10:00', value: 120 },
    { name: '11:00', value: 240 },
    { name: '12:00', value: 180 },
    { name: '13:00', value: 310 },
    { name: '14:00', value: 280 },
    { name: '15:00', value: 450 },
    { name: '16:00', value: 390 }
  ];

  const accessStats = [
    { label: 'Health Records', value: '12k', trend: '+12% this week', icon: <FileText size={18} />, up: true },
    { label: 'Access Approvals', value: '840', trend: '+5% this week', icon: <Key size={18} />, up: true },
    { label: 'Needs Review', value: '18', trend: '2 fewer today', icon: <Clock size={18} />, up: false },
    { label: 'Trusted Nodes', value: networkMetrics.nodes.toString(), trend: 'All healthy', icon: <Shield size={18} />, up: true }
  ];

  const recentActivity = [
    { id: 4120, hash: '0x7f...a12b', type: 'Record Commitment', time: '2m ago', color: '#10b981' },
    { id: 4119, hash: '0x3a...e90c', type: 'Identity Grant', time: '15m ago', color: '#00f2ff' },
    { id: 4118, hash: '0x9d...f443', type: 'Smart Contract Call', time: '1h ago', color: '#f59e0b' },
    { id: 4117, hash: '0x1b...c221', type: 'Node Sync', time: '3h ago', color: '#a855f7' },
    { id: 4116, hash: '0x5c...d889', type: 'Policy Update', time: '5h ago', color: '#ef4444' }
  ];

  const refreshDashboard = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        ehr.getAllPatients(),
        ehr.getAllDoctors()
      ]);
      setPatients(patientsRes.data || []);
      setDoctors(doctorsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    refreshDashboard();

    const interval = setInterval(() => {
      setNetworkMetrics(prev => ({
        ...prev,
        blocks: prev.blocks + (Math.random() > 0.7 ? 1 : 0),
        latency: (Math.floor(Math.random() * 5) + 20) + 'ms'
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const verifyDoctor = async (id: string) => {
    try {
      await ehr.verifyDoctor(id);
      const doctorsRes = await ehr.getAllDoctors();
      setDoctors(doctorsRes.data || []);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Verification failed');
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PageTransition>
      <div className="dashboard-page admin-friendly-page">
        <motion.header 
          className="admin-hero"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div>
            <div className="admin-hero-meta">
              <span className="status-pill status-pill-success pulse-lume">System online</span>
              <span className="admin-eyebrow">Admin workspace</span>
            </div>
            <h1>Welcome back, admin</h1>
            <p className="text-dim">Review doctors, monitor patient access, and keep the care network running smoothly.</p>
          </div>
          <div className="admin-hero-actions">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="admin-secondary-btn" 
              onClick={refreshDashboard}
              type="button"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-lume"
              onClick={() => navigate('/profile')}
              type="button"
            >
              <Settings size={14} />
              <span>Settings</span>
            </motion.button>
          </div>
        </motion.header>

        {/* Network Overview Cards */}
        <motion.div 
          className="metrics-row" 
          variants={container}
          initial="hidden"
          animate="show"
        >
          {accessStats.map((stat) => (
            <motion.div 
              key={stat.label} 
              className="lume-panel metric-card flare-card"
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
              <div className="metric-header">
                <span className="metric-label">{stat.label}</span>
                <div className="metric-icon-box" style={{ borderColor: 'rgba(0, 242, 255, 0.2)' }}>
                  {stat.icon}
                </div>
              </div>
              <div className="metric-value">{stat.value}</div>
              <div className="metric-trend">
                <span style={{ color: stat.up ? '#10b981' : '#ef4444' }}>
                  {stat.up ? 'Good' : 'Review'} · {stat.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="admin-grid">
          {/* Ledger Pulse Chart */}
          <motion.div 
            className="lume-panel admin-main-panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <header className="panel-heading">
              <div>
                <h3>Activity overview</h3>
                <p className="text-dim">Records, approvals, and access changes across the network.</p>
              </div>
              <div className="time-segment">
                {['1H', '24H', '7D'].map(t => (
                  <button 
                    key={t}
                    className={`time-segment-btn ${t === '24H' ? 'active' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </header>
            
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={100}>
                <AreaChart data={transactionData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-dim)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-thin)', borderRadius: 'var(--radius-md)' }}
                    itemStyle={{ color: 'var(--lume-cyan)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00f2ff" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="tab-nav" style={{ marginTop: '2.5rem' }}>
              <button 
                className={`tab-btn ${activeTab === 'doctors' ? 'active' : ''}`}
                onClick={() => navigate('/admin/doctors')}
              >
                <UserCheck size={16} />
                Doctors
              </button>
              <button 
                className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
                onClick={() => navigate('/admin/patients')}
              >
                <Users size={16} />
                Patients
              </button>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {activeTab === 'doctors' && doctors.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state-row">No doctors found. New registrations will appear here for approval.</div>
                      </td>
                    </tr>
                  )}
                  {activeTab === 'patients' && patients.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state-row">No patients found yet. Registered patients will appear here.</div>
                      </td>
                    </tr>
                  )}
                  {activeTab === 'doctors' ? doctors.map((d: any) => (
                    <motion.tr key={d._id || d.id || d.doctorId} variants={item}>
                      <td><span className="id-badge">{(d._id || d.id || d.doctorId || '').substring(0,8)}</span></td>
                      <td>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{d.name}</span>
                          <span className="text-dim" style={{ fontSize: '0.7rem' }}>{d.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`friendly-status ${d.verified ? 'success' : 'warning'}`}>
                          {d.verified ? 'Verified' : 'Needs approval'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!d.verified ? (
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-lume" 
                            style={{ padding: '0.45rem 0.8rem', fontSize: '0.72rem' }} 
                            onClick={() => verifyDoctor(d._id || d.id || d.doctorId)}
                            type="button"
                          >
                            Approve
                          </motion.button>
                        ) : (
                          <span className="verified-check"><CheckCircle2 size={16} /> Complete</span>
                        )}
                      </td>
                    </motion.tr>
                  )) : patients.map((p: any) => (
                    <motion.tr key={p._id || p.id || p.patientId} variants={item}>
                      <td><span className="id-badge">{(p._id || p.id || p.patientId || '').substring(0,12)}...</span></td>
                      <td>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</span>
                          <span className="text-dim" style={{ fontSize: '0.7rem' }}>{p.email}</span>
                        </div>
                      </td>
                      <td><span className="friendly-status success">Active</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="icon-btn table-icon" style={{ display: 'inline-flex' }}>
                          <ShieldCheck size={14} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </motion.div>

          {/* Right Sidebar: Health & Activity */}
          <div className="admin-side-stack">
            <motion.div 
              className="lume-panel admin-side-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <header className="side-panel-heading">
                <div>
                  <span className="metric-label">Network health</span>
                  <h3>Everything looks good</h3>
                </div>
                <Activity size={16} className="text-cyan" />
              </header>
              <div className="ledger-health">
                <div className="health-status-row">
                  <span className="health-label">Latest block</span>
                  <span className="health-value text-cyan">{networkMetrics.blocks}</span>
                </div>
                <div className="health-status-row">
                  <span className="health-label">Response time</span>
                  <span className="health-value" style={{ color: parseInt(networkMetrics.latency) < 30 ? '#10b981' : '#f59e0b' }}>
                    {networkMetrics.latency}
                  </span>
                </div>
                <div className="health-status-row">
                  <span className="health-label">Uptime</span>
                  <span className="health-value" style={{ color: '#10b981' }}>{networkMetrics.uptime}</span>
                </div>
                
                <div className="care-status-card">
                  <div className="metric-label" style={{ fontSize: '0.55rem', marginBottom: '0.5rem' }}>Security status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={14} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Verified identity checks active</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lume-panel scanline" 
              style={{ flex: 1 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <header className="side-panel-heading">
                <div>
                  <span className="metric-label">Recent activity</span>
                  <h3>Latest updates</h3>
                </div>
              </header>
              <div className="ledger-events">
                {recentActivity.map((event, idx) => (
                  <motion.div 
                    key={event.id} 
                    className="event-item"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + (idx * 0.1) }}
                  >
                    <div className="event-indicator" style={{ backgroundColor: event.color }}></div>
                    <div className="event-details">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="event-type">{event.type}</span>
                        <span className="event-time">{event.time}</span>
                      </div>
                      <span className="event-hash">TX: {event.hash}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.98 }}
                className="icon-btn" 
                style={{ width: '100%', marginTop: '2rem', height: '44px', gap: '0.5rem' }}
                onClick={() => navigate('/admin/patients')}
                type="button"
              >
                <Cpu size={14} />
                <span className="metric-label">View details</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;

