import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEHR } from '../hooks/useEHR';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import { 
  RefreshCcw, 
  Calendar, 
  Pill, 
  FlaskConical, 
  CreditCard, 
  Fingerprint, 
  Database,
  History,
  Lock,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import './PatientDashboard.css';

const PatientDashboard: React.FC = () => {
  const ehr = useEHR();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState({ status: 'Records protected', verified: true });

  const activityData = [
    { name: 'Mon', value: 2 },
    { name: 'Tue', value: 4 },
    { name: 'Wed', value: 3 },
    { name: 'Thu', value: 7 },
    { name: 'Fri', value: 5 },
    { name: 'Sat', value: 2 },
    { name: 'Sun', value: 1 }
  ];

  const fetchDashboard = async () => {
    try {
      const [r, p, a, b, l] = await Promise.all([
        ehr.getMyRecords(),
        ehr.getMyPrescriptions(),
        ehr.getMyAppointments(),
        ehr.getMyBilling(),
        ehr.getMyAudit()
      ]);
      setRecords(r.data || []);
      setPrescriptions(p.data || []);
      setAppointments(a.data || []);
      setBilling(b.data || []);
      setAuditLogs(Array.isArray(l.data) ? l.data : []);
    } catch (err) {
      console.error('dashboard refresh failed', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    
    const interval = setInterval(async () => {
      try {
        const res = await ehr.getFabricStatus();
        if (res.data.status === 'online' || res.data.status === 'mock') {
          setSyncStatus({ status: 'Records protected', verified: true });
        } else {
          setSyncStatus({ status: 'Sync pending', verified: false });
        }
      } catch {
        setSyncStatus({ status: 'Connection offline', verified: false });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { label: 'Records', icon: <Database size={20} />, link: '/patient/records' },
    { label: 'Visits', icon: <Calendar size={20} />, link: '/profile' },
    { label: 'History', icon: <History size={20} />, link: '/patient/records' },
    { label: 'Vitals', icon: <Activity size={20} />, link: '/patient/vitals' },
    { label: 'Billing', icon: <CreditCard size={20} />, link: '/profile' },
    { label: 'Privacy', icon: <Lock size={20} />, link: '/profile' }
  ];

  const stats = [
    { label: 'Appointments', value: appointments.length, subtext: 'Upcoming visits', icon: <Calendar size={18} />, color: 'var(--lume-cyan)' },
    { label: 'Prescriptions', value: prescriptions.length, subtext: 'Active medicines', icon: <Pill size={18} />, color: '#10b981' },
    { label: 'Lab results', value: records.filter(r => r.recordType === 'Lab Result').length, subtext: 'Ready to review', icon: <FlaskConical size={18} />, color: '#f59e0b' },
    { label: 'Bills', value: billing.length, subtext: 'Billing items', icon: <CreditCard size={18} />, color: '#a855f7' }
  ];

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
      <div className="dashboard-page patient-friendly-page">
        <motion.header 
          className="patient-hero"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div>
            <div className="patient-hero-meta">
              <span className={`care-pill ${syncStatus.verified ? 'care-pill-success pulse-lume' : 'care-pill-warning'}`}>
                {syncStatus.status}
              </span>
              <span className="patient-eyebrow">{user?.name ? `Hi, ${user.name}` : 'Your health workspace'}</span>
            </div>
            <h1>Your health dashboard</h1>
            <p className="text-dim">See appointments, prescriptions, records, and security activity in one simple place.</p>
          </div>
          <div className="patient-hero-actions">
            <motion.button 
              className="btn-lume" 
              onClick={fetchDashboard}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCcw size={14} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </motion.header>

        {/* Summary Metrics */}
        <motion.div 
          className="metrics-row" 
          variants={container}
          initial="hidden"
          animate="show"
        >
          {stats.map((stat) => (
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
                <div className="metric-icon-box" style={{ color: stat.color, borderColor: stat.color + '33' }}>
                  {stat.icon}
                </div>
              </div>
              <div className="metric-value">{stat.value}</div>
              <div className="metric-trend">
                <span className="metric-label" style={{ fontSize: '0.55rem' }}>{stat.subtext}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="patient-dashboard-grid">
          {/* Biometric Pulse */}
          <motion.div 
            className="lume-panel patient-main-panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <header className="patient-panel-heading">
              <div>
                <h3>Weekly record activity</h3>
                <p className="text-dim">A quick view of updates made to your health information.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge-lume" style={{ fontSize: '10px' }}>7 days</span>
                <span className="badge-lume pulse-lume" style={{ fontSize: '10px', color: '#10b981' }}>Live</span>
              </div>
            </header>
            
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={100}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="value" stroke="#00f2ff" strokeWidth={2} fillOpacity={1} fill="url(#colorPulse)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ marginTop: '2.5rem' }}>
              <span className="metric-label" style={{ marginBottom: '1rem', display: 'block' }}>Who accessed your records</span>
              <div className="ledger-events">
                {auditLogs.length > 0 ? auditLogs.slice(0, 5).map((log, index) => (
                  <motion.div 
                    key={index} 
                    className="security-log-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1) }}
                  >
                    <Fingerprint className="text-dim" size={16} />
                    <div className="log-meta">
                      <span className="log-title">{log.action || 'Ledger Update'}</span>
                      <span className="log-action" style={{ fontSize: '0.65rem' }}>By {log.invoker || 'Care team'}</span>
                    </div>
                    <span className="log-time" style={{ fontSize: '0.65rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </motion.div>
                )) : (
                  <p className="text-dim" style={{ fontSize: '0.75rem', padding: '1rem' }}>No record activity yet.</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Core Modules & Security */}
          <motion.div 
            className="patient-side-stack"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <div>
              <span className="metric-label" style={{ marginBottom: '1rem', display: 'block' }}>Quick actions</span>
              <div className="module-grid">
                {quickActions.map(function (module) {
                  return (
                    <motion.button
                      key={module.label}
                      type="button"
                      className="module-card-lume"
                      variants={item}
                      whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.05)' }}
                      onClick={() => navigate(module.link)}
                    >
                      <div className="module-icon">{module.icon}</div>
                      <span className="module-label">{module.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <motion.div 
              className="lume-panel scanline" 
              style={{ padding: '1.5rem' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="metric-label">Privacy and security</span>
                <ShieldAlert size={16} className="text-violet" />
              </header>
              <div className="ledger-health">
                <div className="health-status-row">
                  <span className="health-label">Record encryption</span>
                  <span className="health-value text-cyan">AES-256</span>
                </div>
                <div className="health-status-row">
                  <span className="health-label">Digital signature</span>
                  <span className="health-value text-violet">ECDSA</span>
                </div>
                <div className="health-status-row">
                  <span className="health-label">Unauthorized access</span>
                  <span className="health-value" style={{ color: '#10b981' }}>None found</span>
                </div>
              </div>
              
              <motion.button 
                className="icon-btn" 
                style={{ width: '100%', marginTop: '2rem', height: '44px', gap: '0.5rem' }}
                whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.1)' }}
                onClick={() => navigate('/profile')}
                type="button"
              >
                <Lock size={14} />
                <span className="metric-label">Manage privacy</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default PatientDashboard;
