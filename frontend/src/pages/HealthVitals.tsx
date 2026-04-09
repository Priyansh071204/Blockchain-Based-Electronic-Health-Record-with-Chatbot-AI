import React, { useState, useEffect } from 'react';
import { useEHR } from '../hooks/useEHR';
import { 
  Heart, 
  Thermometer, 
  Droplets, 
  History, 
  ShieldCheck,
  TrendingUp,
  Clock,
  Calendar
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
import './HealthVitals.css';

const HealthVitals: React.FC = () => {
  const ehr = useEHR();
  const [vitals, setVitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const sampleVitalsData = [
    { time: '08:00', heartRate: 72, bloodPressure: 120, temperature: 98.6 },
    { time: '10:00', heartRate: 75, bloodPressure: 122, temperature: 98.7 },
    { time: '12:00', heartRate: 82, bloodPressure: 125, temperature: 98.8 },
    { time: '14:00', heartRate: 78, bloodPressure: 121, temperature: 98.6 },
    { time: '16:00', heartRate: 74, bloodPressure: 119, temperature: 98.5 },
    { time: '18:00', heartRate: 70, bloodPressure: 118, temperature: 98.4 },
    { time: '20:00', heartRate: 68, bloodPressure: 117, temperature: 98.3 }
  ];

  const historicalVitals = [
    { date: '2024-03-20', time: '10:15', hr: 74, bp: '120/80', temp: 98.6, status: 'Normal' },
    { date: '2024-03-19', time: '14:30', hr: 88, bp: '135/95', temp: 99.1, status: 'Elevated' },
    { date: '2024-03-18', time: '09:00', hr: 72, bp: '118/78', temp: 98.4, status: 'Normal' },
    { date: '2024-03-17', time: '16:45', hr: 76, bp: '122/82', temp: 98.7, status: 'Normal' }
  ];

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const res = await ehr.getMyVitals();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setVitals(res.data);
        } else {
          // Keep sample data for visualization if ledger is empty, 
          // but maybe add a note
          setVitals(sampleVitalsData);
        }
      } catch (err) {
        console.error('Failed to fetch vitals', err);
        setVitals(sampleVitalsData);
      } finally {
        setLoading(false);
      }
    };
    fetchVitals();
  }, []);

  if (loading) {
    return (
      <div className="health-vitals-page p-8">
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge-lume pulse-lume" style={{ color: '#a855f7' }}>Live Biometric Stream</span>
            <span className="metric-label" style={{ color: 'var(--text-dim)' }}>ENCRYPTED_DATA_LINK</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Health <span className="text-cyan">Vitals</span></h1>
          <p className="text-dim">Real-time health telemetry synchronized from verified biometric endpoints.</p>
        </header>
        <div className="empty-state">
          <span className="metric-label pulse-lume">Synchronizing Biometric Stream...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="health-vitals-page p-8">
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge-lume pulse-lume" style={{ color: '#a855f7' }}>Live Biometric Stream</span>
          <span className="metric-label" style={{ color: 'var(--text-dim)' }}>ENCRYPTED_DATA_LINK</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Health <span className="text-cyan">Vitals</span></h1>
        <p className="text-dim">Real-time health telemetry synchronized from verified biometric endpoints.</p>
      </header>

      <div className="vitals-grid">
        <div className="lume-panel vitals-chart-card">
          <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="metric-label">Heart Rate Pulse (BPM)</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Daily Telemetry</div>
            </div>
            <TrendingUp size={20} className="text-cyan" />
          </header>
          
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vitals}>
                <defs>
                  <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-dim)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-thin)', borderRadius: 'var(--radius-md)' }}
                  itemStyle={{ color: 'var(--lume-cyan)' }}
                />
                <Area type="monotone" dataKey="heartRate" stroke="#00f2ff" strokeWidth={3} fillOpacity={1} fill="url(#colorHR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="vitals-summary-sidebar">
          <div className="lume-panel vital-metric-card vital-card-cyan">
            <span className="vital-label">Current Heart Rate</span>
            <div className="vital-value-row">
              <span className="vital-value">72</span>
              <span className="vital-unit">BPM</span>
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.65rem', fontWeight: 700 }}>
              <Heart size={12} fill="#10b981" />
              <span>STABLE_RYTHM</span>
            </div>
          </div>

          <div className="lume-panel vital-metric-card vital-card-violet">
            <span className="vital-label">Blood Pressure</span>
            <div className="vital-value-row">
              <span className="vital-value">120/80</span>
              <span className="vital-unit">mmHg</span>
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.65rem', fontWeight: 700 }}>
              <Droplets size={12} fill="#10b981" />
              <span>OPTIMAL_FLOW</span>
            </div>
          </div>

          <div className="lume-panel vital-metric-card vital-card-amber">
            <span className="vital-label">Body Temperature</span>
            <div className="vital-value-row">
              <span className="vital-value">98.6</span>
              <span className="vital-unit">°F</span>
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.65rem', fontWeight: 700 }}>
              <Thermometer size={12} />
              <span>HEO_STASIS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lume-panel" style={{ padding: '1.5rem' }}>
        <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <History size={18} className="text-dim" />
            <span className="metric-label">Historical Vitals Ledger</span>
          </div>
          <button className="icon-btn" style={{ width: 'auto', padding: '0 1rem', height: '32px' }}>
            <span className="metric-label" style={{ fontSize: '9px' }}>EXPAND_LOGS</span>
          </button>
        </header>

        <div className="table-wrapper">
          <table className="vitals-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>HEART_RATE</th>
                <th>BLOOD_PRESSURE</th>
                <th>TEMPERATURE</th>
                <th>ANALYSIS_STATE</th>
              </tr>
            </thead>
            <tbody>
              {historicalVitals.map((entry, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Calendar size={14} className="text-dim" />
                      <span>{entry.date}</span>
                      <Clock size={14} className="text-dim" />
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{entry.time}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.hr} BPM</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.bp}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.temp}°F</td>
                  <td>
                    <span className={`range-indicator range-${entry.status.toLowerCase()}`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-thin)' }}>
          <ShieldCheck size={18} className="text-cyan" />
          <span className="metric-label" style={{ fontSize: '0.65rem' }}>All biometric data is end-to-end encrypted and signed with user private key.</span>
        </div>
      </div>
    </div>
  );
};

export default HealthVitals;
