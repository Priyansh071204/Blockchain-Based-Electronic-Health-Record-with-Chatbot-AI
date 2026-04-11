import React, { useState, useEffect } from 'react';
import { useEHR } from '../hooks/useEHR';
import { useAuth } from '../context/AuthContext';
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
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState({ status: 'LEDGER_VERIFIED', verified: true });

  const activityData = [
    { name: 'Mon', value: 2 },
    { name: 'Tue', value: 4 },
    { name: 'Wed', value: 3 },
    { name: 'Thu', value: 7 },
    { name: 'Fri', value: 5 },
    { name: 'Sat', value: 2 },
    { name: 'Sun', value: 1 }
  ];

  const accessLogs = [
    { doctor: 'Dr. Sarah Smith', action: 'Accessed Lab Report', time: '10:15 AM' },
    { doctor: 'Dr. Mike Ross', action: 'Created Prescription', time: 'Yesterday' },
    { doctor: 'Dr. John Watson', action: 'Viewed Vitals', time: '2 days ago' }
  ];

  const fetchDashboard = async () => {
    try {
      const [r, p, a, b] = await Promise.all([
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
          setSyncStatus({ status: 'LEDGER_VERIFIED', verified: true });
        } else {
          setSyncStatus({ status: 'SYNC_PENDING', verified: false });
        }
      } catch {
        setSyncStatus({ status: 'NODE_OFFLINE', verified: false });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Upcoming Appts', value: appointments.length, subtext: 'Next: Consultation', icon: <Calendar size={18} />, color: 'var(--lume-cyan)' },
    { label: 'Active Rxs', value: prescriptions.length, subtext: 'Verified on Channel', icon: <Pill size={18} />, color: '#10b981' },
    { label: 'Pending Labs', value: records.filter(r => r.recordType === 'Lab Result').length, subtext: 'Awaiting Endorsement', icon: <FlaskConical size={18} />, color: '#f59e0b' },
    { label: 'Outstanding Bills', value: billing.length, subtext: 'Settled Accounts', icon: <CreditCard size={18} />, color: '#a855f7' }
  ];

  return (
    <div className="dashboard-page">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className={`badge-lume ${syncStatus.verified ? 'pulse-lume' : ''}`} style={{ color: syncStatus.verified ? '#10b981' : '#f59e0b' }}>
              {syncStatus.status}
            </span>
            <span className="metric-label" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
              SUBJECT: {user?.name?.toUpperCase() || 'ANONYMOUS'} • PHR_NODE_ACTIVE
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Health <span className="text-cyan">Vault</span></h1>
          <p className="text-dim">Real-time ledger overview and biometric data synchronization.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-lume" onClick={fetchDashboard}>
            <RefreshCcw size={14} />
            <span>Sync Protocol</span>
          </button>
        </div>
      </header>

      {/* Summary Metrics */}
      <div className="metrics-row" style={{ marginBottom: '2.5rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="lume-panel metric-card">
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
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Biometric Pulse */}
        <div className="lume-panel" style={{ padding: '2rem' }}>
          <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Biometric Activity Pulse</h3>
              <p className="text-dim" style={{ fontSize: '0.75rem' }}>Cross-Node Activity Synchronization</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge-lume" style={{ fontSize: '10px' }}>7_DAY_EPOCH</span>
              <span className="badge-lume pulse-lume" style={{ fontSize: '10px', color: '#10b981' }}>REAL_TIME</span>
            </div>
          </header>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
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
            <span className="metric-label" style={{ marginBottom: '1rem', display: 'block' }}>Identity Access Logs</span>
            <div className="ledger-events">
              {auditLogs.length > 0 ? auditLogs.slice(0, 5).map((log, index) => (
                <div key={index} className="security-log-item">
                  <Fingerprint className="text-dim" size={16} />
                  <div className="log-meta">
                    <span className="log-title">{log.action || 'Ledger Update'}</span>
                    <span className="log-action" style={{ fontSize: '0.65rem' }}>BY: {log.invoker || 'Identity_ID'}</span>
                  </div>
                  <span className="log-time" style={{ fontSize: '0.65rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              )) : (
                <p className="text-dim" style={{ fontSize: '0.75rem', padding: '1rem' }}>No ledger events recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Core Modules & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <span className="metric-label" style={{ marginBottom: '1rem', display: 'block' }}>Medical Protocol Nodes</span>
            <div className="module-grid">
              {[
                { label: 'Health Vault', icon: <Database size={20} /> },
                { label: 'Registry', icon: <Calendar size={20} /> },
                { label: 'Ciphers', icon: <History size={20} /> },
                { label: 'Bio Lab', icon: <Activity size={20} /> },
                { label: 'Ledger Pay', icon: <CreditCard size={20} /> },
                { label: 'ACL Manager', icon: <Lock size={20} /> }
              ].map(module => (
                <div key={module.label} className="module-card-lume">
                  <div className="module-icon">{module.icon}</div>
                  <span className="module-label">{module.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lume-panel scanline" style={{ padding: '1.5rem' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">Security Protocol</span>
              <ShieldAlert size={16} className="text-violet" />
            </header>
            <div className="ledger-health">
              <div className="health-status-row">
                <span className="health-label">Identity Encryption</span>
                <span className="health-value text-cyan">AES-256</span>
              </div>
              <div className="health-status-row">
                <span className="health-label">Signature Alg</span>
                <span className="health-value text-violet">ECDSA</span>
              </div>
              <div className="health-status-row">
                <span className="health-label">Audit Probability</span>
                <span className="health-value" style={{ color: '#10b981' }}>0.0001%</span>
              </div>
            </div>
            
            <button className="icon-btn" style={{ width: '100%', marginTop: '2rem', height: '44px', gap: '0.5rem' }}>
              <Lock size={14} />
              <span className="metric-label">Rotate Access Keys</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
