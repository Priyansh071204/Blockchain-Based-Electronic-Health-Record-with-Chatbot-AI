import React, { useState, useEffect } from 'react';
import { useEHR } from '../hooks/useEHR';
import { useAuth } from '../context/AuthContext';
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
  const [, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const triageDistribution = [
    { name: 'Stable', value: 12, color: '#10b981' },
    { name: 'Observation', value: 5, color: '#a855f7' },
    { name: 'Consultation', value: 8, color: '#00f2ff' },
    { name: 'Urgent', value: 2, color: '#ef4444' }
  ];

  const triageQueue = [
    { id: 'Q1', name: 'John Doe', status: 'Waiting', time: '12m', vitals: '98 bpm', type: 'Stable' },
    { id: 'Q2', name: 'Sarah Wilson', status: 'Urgent', time: '5m', vitals: 'Check BP', type: 'Urgent' },
    { id: 'Q3', name: 'Robert Fox', status: 'In Session', time: '20m', vitals: '102 bpm', type: 'Observation' }
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

  const filteredTriage = triageQueue.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-page">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge-lume pulse-lume" style={{ color: '#10b981' }}>Verified Practitioner</span>
            <span className="metric-label" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
              DR. {user?.name?.toUpperCase() || 'SYSTEM'} • LICENSE_VERIFIED
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Clinical <span className="text-cyan">Console</span></h1>
          <p className="text-dim">Real-time patient triage and ledger-backed medical history.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-lume">
            <PlusCircle size={16} />
            <span>New Consultation</span>
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        {/* Analytics & Triage Stats */}
        <div className="analytics-panel">
          <div className="lume-panel queue-card">
            <span className="metric-label">Queue Distribution</span>
            <div className="chart-container" style={{ height: '220px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
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
                <span className="metric-label" style={{ fontSize: '0.55rem' }}>Avg Waiting</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem' }}>12.5m</span>
              </div>
              <div className="queue-stat-item">
                <span className="metric-label" style={{ fontSize: '0.55rem' }}>Urgent Cases</span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ef4444' }}>2 Active</span>
              </div>
            </div>
          </div>

          <div className="lume-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="metric-label" style={{ fontSize: '0.55rem' }}>Peer Node</span>
                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>Fabric-Dr-01</div>
              </div>
              <div className="metric-icon-box" style={{ color: 'var(--lume-cyan)', borderColor: 'var(--lume-cyan)' }}>
                <Stethoscope size={18} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <div className="pulse-dot"></div>
              Channel Sync Active
            </div>
          </div>
        </div>

        {/* Patient Triage Terminal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="search-console">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Query patient identity or clinical identifier..."
              />
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', borderLeft: '1px solid var(--border-thin)' }}>
                <Filter size={18} className="text-dim" />
              </div>
          </div>

          <div className="lume-panel overflow-hidden">
            <header style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-thin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">Active Patient Triage</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot"></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>BLOCK: 4120</span>
              </div>
            </header>

            <div className="table-wrapper">
              <table className="triage-table">
                <thead>
                  <tr>
                    <th>Identity Hash</th>
                    <th>Subject Name</th>
                    <th>Priority</th>
                    <th>Wait Delta</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTriage.map((p) => (
                    <tr key={p.id} className="triage-row">
                      <td><span className="id-badge">{p.id}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</span>
                      </td>
                      <td>
                        <span className={`badge-status ${p.status === 'Urgent' ? 'urgent' : p.status === 'Waiting' ? 'waiting' : 'session'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          <Clock size={12} />
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{p.time}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button className="btn-action" title="Commit Record">
                            <SquarePlus size={16} />
                          </button>
                          <button className="btn-action" title="Audit History">
                            <HistoryIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
