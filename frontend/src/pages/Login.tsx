import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
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
    <PageTransition>
      <div className="auth-page">
        {/* Dynamic Background Grid */}
        <div className="auth-bg-overlay"></div>
        
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <header className="auth-header">
            <motion.div 
              className="logo-lume"
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <Shield size={32} />
            </motion.div>
            <h1 className="auth-title">PROTOCOL <span className="text-cyan">ACCESS</span></h1>
            <div className="auth-subtitle">MSP Identity Gateway v5.0</div>
          </header>

          <div className="lume-panel overflow-hidden">
            {isLoading && <div className="loading-line"></div>}
            
            <div style={{ padding: '2.5rem' }}>
              <form onSubmit={handleLogin}>
                <motion.div 
                  className="form-group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
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
                </motion.div>

                <motion.div 
                  className="form-group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
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
                </motion.div>

                <div className="auth-footer-actions">
                  <label className="checkbox-group">
                    <input type="checkbox" />
                    <span className="checkbox-label">Keep Sync Active</span>
                  </label>
                  <span className="link-lume">Reset Cipher</span>
                </div>

                {error && (
                  <motion.div 
                    className="error-lume"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    ACCESS_DENIED: {error}
                  </motion.div>
                )}

                <motion.button 
                  type="submit" 
                  className="btn-lume w-full justify-center"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {!isLoading ? <CheckCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
                  {isLoading ? 'Verifying...' : 'Authorize Access'}
                </motion.button>
              </form>

              <div className="emulation-section">
                <span className="emulation-label">Protocol Emulation</span>
                <div className="emulation-grid">
                  {[
                    { role: 'admin' as const, label: 'ADMIN_DEV', icon: <Terminal size={20} /> },
                    { role: 'doctor' as const, label: 'DR_PROTO', icon: <Stethoscope size={20} /> },
                    { role: 'patient' as const, label: 'PAT_IDENTITY', icon: <User size={20} /> }
                  ].map((item, i) => (
                    <motion.button 
                      key={item.role}
                      onClick={() => loginAs(item.role)} 
                      className="emulation-btn"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      whileHover={{ scale: 1.05, borderColor: 'var(--lume-cyan)' }}
                    >
                      <div className="btn-icon">{item.icon}</div>
                      <span className="btn-text">{item.label}</span>
                    </motion.button>
                  ))}
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
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Login;
