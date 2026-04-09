import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Mail, 
  Lock, 
  CheckCircle, 
  Loader2, 
  Terminal, 
  Stethoscope, 
  User,
  Activity
} from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      const destMap: Record<string, string> = { 
        admin: '/admin', 
        doctor: '/doctor', 
        patient: '/patient' 
      };
      navigate(destMap[user.role] || '/');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAs = (role: 'admin' | 'doctor' | 'patient') => {
    const creds = {
      admin: { email: 'admin@ehr.local', password: 'Admin@123' },
      doctor: { email: 'doctor@ehr.local', password: 'Doctor@123' },
      patient: { email: 'patient@ehr.local', password: 'Patient@123' }
    };
    const { email: devEmail, password: devPassword } = creds[role];
    setEmail(devEmail);
    setPassword(devPassword);
    
    // Automatically trigger form submission
    setTimeout(() => {
      const form = document.querySelector('form');
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <div className="logo-lume">
            <Shield size={32} />
          </div>
          <h1 className="auth-title">PROTOCOL <span className="text-cyan">ACCESS</span></h1>
          <div className="auth-subtitle">MSP Identity Gateway v5.0</div>
        </header>

        <div className="lume-panel overflow-hidden">
          {isLoading && <div className="loading-line"></div>}
          
          <div style={{ padding: '2.5rem' }}>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Identity Endpoint</label>
                <div className="input-container">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="msp.identifier@ehr.local"
                    className="input-lume has-icon"
                  />
                  <Mail className="input-icon" size={18} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cryptographic Key</label>
                <div className="input-container">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="input-lume has-icon"
                  />
                  <Lock className="input-icon" size={18} />
                </div>
              </div>

              <div className="auth-footer-actions">
                <label className="checkbox-group">
                  <input type="checkbox" />
                  <span className="checkbox-label">Keep Sync Active</span>
                </label>
                <span className="link-lume">Reset Cipher</span>
              </div>

              {error && (
                <div className="error-lume">
                  ACCESS_DENIED: {error}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-lume w-full justify-center"
                disabled={isLoading}
              >
                {!isLoading ? <CheckCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
                {isLoading ? 'Verifying...' : 'Authorize Access'}
              </button>
            </form>

            <div className="emulation-section">
              <span className="emulation-label">Protocol Emulation</span>
              <div className="emulation-grid">
                <button onClick={() => loginAs('admin')} className="emulation-btn">
                  <Terminal className="btn-icon" size={20} />
                  <span className="btn-text">ADMIN_DEV</span>
                </button>
                <button onClick={() => loginAs('doctor')} className="emulation-btn">
                  <Stethoscope className="btn-icon" size={20} />
                  <span className="btn-text">DR_PROTO</span>
                </button>
                <button onClick={() => loginAs('patient')} className="emulation-btn">
                  <User className="btn-icon" size={20} />
                  <span className="btn-text">PAT_IDENTITY</span>
                </button>
              </div>
            </div>
          </div>

          <div 
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.01)', 
              padding: '1.5rem', 
              borderTop: '1px solid var(--border-thin)',
              textAlign: 'center'
            }}
          >
            <p className="auth-switch">
              New Member? <Link to="/register" className="link-lume">Enroll in Channel</Link>
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', opacity: 0.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={12} className="text-cyan" />
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>CH: MAIN_LEDGER [SYNC]</span>
            </div>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>CIPHER: AES-256-GCM</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
