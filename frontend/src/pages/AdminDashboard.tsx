import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEHR } from '../hooks/useEHR';
import { 
  Terminal, 
  Settings, 
  ShieldCheck, 
  FileText, 
  Key, 
  Clock, 
  Shield, 
  Cpu, 
  AlertCircle,
  Activity
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
    { label: 'Total Records', value: '12.k', trend: '+12%', icon: <FileText size={18} />, up: true, accent: 'text-cyan' },
    { label: 'Access Grants', value: '840', trend: '+5%', icon: <Key size={18} />, up: true, accent: 'text-violet' },
    { label: 'Pending Requests', value: '18', trend: '-2%', icon: <Clock size={18} />, up: false, accent: 'text-red' },
    { label: 'Verified Nodes', value: '4', trend: 'Stable', icon: <Shield size={18} />, up: true, accent: 'text-cyan' }
  ];

  const recentActivity = [
    { id: 4120, hash: '0x7f...a12b', type: 'Record Commitment', time: '2m ago', color: '#10b981' },
    { id: 4119, hash: '0x3a...e90c', type: 'Identity Grant', time: '15m ago', color: '#00f2ff' },
    { id: 4118, hash: '0x9d...f443', type: 'Smart Contract Call', time: '1h ago', color: '#f59e0b' },
    { id: 4117, hash: '0x1b...c221', type: 'Node Sync', time: '3h ago', color: '#a855f7' },
    { id: 4116, hash: '0x5c...d889', type: 'Policy Update', time: '5h ago', color: '#ef4444' }
  ];

  useEffect(() => {
    const fetchAll = async () => {
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
    fetchAll();

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

  return (
    <div className="dashboard-page">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge-lume pulse-lume" style={{ color: '#10b981' }}>Network Online</span>
            <span className="metric-label" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>HYPERLEDGER_FABRIC_V2.5</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Network <span className="text-cyan">Orchestrator</span></h1>
          <p className="text-dim">Real-time ledger monitoring and MSP identity provisioning.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="icon-btn" style={{ width: 'auto', padding: '0 1rem', gap: '0.5rem' }}>
            <Terminal size={14} />
            <span className="metric-label">CLI</span>
          </button>
          <button className="btn-lume">
            <Settings size={14} />
            <span>Configure Node</span>
          </button>
        </div>
      </header>

      {/* Network Overview Cards */}
      <div className="metrics-row" style={{ marginBottom: '2.5rem' }}>
        {accessStats.map((stat) => (
          <div key={stat.label} className="lume-panel metric-card">
            <div className="metric-header">
              <span className="metric-label">{stat.label}</span>
              <div className="metric-icon-box">
                {stat.icon}
              </div>
            </div>
            <div className="metric-value">{stat.value}</div>
            <div className="metric-trend">
              <span style={{ color: stat.up ? '#10b981' : '#ef4444' }}>
                {stat.up ? '↑' : '↓'} {stat.trend}
              </span>
              <span className="metric-label" style={{ fontSize: '0.55rem' }}>Vs Epoch</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
        {/* Ledger Pulse Chart */}
        <div className="lume-panel" style={{ gridColumn: 'span 2', padding: '2rem' }}>
          <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ledger Pulse</h3>
              <p className="text-dim" style={{ fontSize: '0.75rem' }}>Transaction throughput throughout the channel</p>
            </div>
            <div style={{ padding: '0.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.25rem' }}>
              {['1H', '24H', '7D'].map(t => (
                <button 
                  key={t}
                  className="tab-btn"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '10px', minWidth: '40px', background: t === '24H' ? 'var(--bg-panel)' : 'transparent', color: t === '24H' ? 'var(--lume-cyan)' : 'var(--text-dim)' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </header>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
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
              Doctor Verification
            </button>
            <button 
              className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
              onClick={() => navigate('/admin/patients')}
            >
              Patient Registry
            </button>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>MSP_IDENTITY</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'doctors' ? doctors.map((d: any) => (
                  <tr key={d._id}>
                    <td><span className="id-badge">{d._id.substring(0,8)}</span></td>
                    <td>
                      <div className="flex flex-col">
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{d.name}</span>
                        <span className="text-dim" style={{ fontSize: '0.7rem' }}>{d.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-lume" style={{ color: d.verified ? '#10b981' : '#f59e0b', border: 'none', background: 'rgba(255,255,255,0.03)' }}>
                        {d.verified ? 'AUTHORIZED' : 'PENDING_SIG'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!d.verified ? (
                        <button className="btn-lume" style={{ padding: '0.4rem 0.75rem', fontSize: '10px' }} onClick={() => verifyDoctor(d._id)}>
                          SIGN & VERIFY
                        </button>
                      ) : (
                        <div className="icon-btn" style={{ display: 'inline-flex' }}>
                          <AlertCircle size={14} />
                        </div>
                      )}
                    </td>
                  </tr>
                )) : patients.map((p: any) => (
                  <tr key={p._id}>
                    <td><span className="id-badge">{p._id.substring(0,12)}...</span></td>
                    <td>
                      <div className="flex flex-col">
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</span>
                        <span className="text-dim" style={{ fontSize: '0.7rem' }}>{p.email}</span>
                      </div>
                    </td>
                    <td><span className="badge-lume" style={{ color: '#10b981' }}>INDEXED</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="icon-btn" style={{ display: 'inline-flex' }}>
                        <ShieldCheck size={14} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Health & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="lume-panel" style={{ padding: '1.5rem' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">Ledger Health</span>
              <Activity size={16} className="text-cyan" />
            </header>
            <div className="ledger-health">
              <div className="health-status-row">
                <span className="health-label">Block Height</span>
                <span className="health-value text-cyan">{networkMetrics.blocks}</span>
              </div>
              <div className="health-status-row">
                <span className="health-label">Channel Latency</span>
                <span className="health-value" style={{ color: parseInt(networkMetrics.latency) < 30 ? '#10b981' : '#f59e0b' }}>
                  {networkMetrics.latency}
                </span>
              </div>
              <div className="health-status-row">
                <span className="health-label">Peer Uptime</span>
                <span className="health-value" style={{ color: '#10b981' }}>{networkMetrics.uptime}</span>
              </div>
              
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-thin)' }}>
                <div className="metric-label" style={{ fontSize: '0.55rem', marginBottom: '0.5rem' }}>Protocol Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>X.509 MSP Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lume-panel scanline" style={{ padding: '1.5rem', flex: 1 }}>
            <header style={{ marginBottom: '1.5rem' }}>
              <span className="metric-label">Recent Ledger Events</span>
            </header>
            <div className="ledger-events">
              {recentActivity.map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-indicator" style={{ backgroundColor: event.color }}></div>
                  <div className="event-details">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="event-type">{event.type}</span>
                      <span className="event-time">{event.time}</span>
                    </div>
                    <span className="event-hash">TX: {event.hash}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="icon-btn" style={{ width: '100%', marginTop: '2rem', height: '44px', gap: '0.5rem' }}>
              <Cpu size={14} />
              <span className="metric-label">Explore Blocks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
