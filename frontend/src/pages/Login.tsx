import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import Medical3DBackground from '../components/Medical3DBackground';
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye,
  EyeOff,
  Loader2, 
  Terminal, 
  Stethoscope, 
  User,
  Activity,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
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
      <div className="auth-page font-main">
        {/* Modern 3D Canvas Background */}
        <Medical3DBackground />
        
        {/* Subtle overlay elements for lighting */}
        <div className="auth-glow-overlay" />
        <div className="scanline" />

        <div className="login-portal-wrapper">
          {/* Left space for 3D visual graphics on desktop */}
          <div className="hero-branding-side">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="branding-content"
            >
              <div className="pulse-tag">
                <span className="pulse-dot"></span>
                <span className="pulse-text font-mono">LIVE SECURE CARE NETWORK</span>
              </div>

              <div className="login-3d-stage" aria-hidden="true">
                <div className="orbital-ring ring-one"></div>
                <div className="orbital-ring ring-two"></div>
                <div className="orbital-ring ring-three"></div>
                <div className="holo-floor"></div>
                <div className="beam beam-one"></div>
                <div className="beam beam-two"></div>
                <div className="beam beam-three"></div>
                <div className="medical-core">
                  <div className="core-inner">
                    <Shield size={34} />
                    <span>MedChain</span>
                  </div>
                </div>
                <div className="floating-data-card card-vitals">
                  <span>Vitals</span>
                  <strong>HR 72 BPM</strong>
                  <small>Stable</small>
                </div>
                <div className="floating-data-card card-ledger">
                  <span>Ledger</span>
                  <strong>Block verified</strong>
                  <small>0x7A9B...FE43</small>
                </div>
                <div className="floating-data-card card-access">
                  <span>Access</span>
                  <strong>Encrypted</strong>
                  <small>HIPAA-ready</small>
                </div>
                <div className="holo-chip chip-admin">Admin</div>
                <div className="holo-chip chip-doctor">Doctor</div>
                <div className="holo-chip chip-patient">Patient</div>
              </div>

              <h2 className="branding-title">
                Secure access to your <span className="gradient-text">health records</span>
              </h2>
              <p className="branding-desc">
                A polished care workspace for admins, doctors, and patients with encrypted sign-in and real-time record protection.
              </p>
              <div className="trust-row">
                <span>Encrypted identity</span>
                <span>Audit trail</span>
                <span>Role-based access</span>
              </div>
              <div className="security-telemetry">
                <div>
                  <span>Records secured</span>
                  <strong>12k+</strong>
                </div>
                <div>
                  <span>Node latency</span>
                  <strong>24ms</strong>
                </div>
                <div>
                  <span>Access checks</span>
                  <strong>840</strong>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right glassmorphic login panel */}
          <motion.div 
            className="auth-card-panel glass-panel hud-panel"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 90 }}
          >
            {/* Tech Corner Overlays */}
            <div className="hud-corner-bracket top-left"></div>
            <div className="hud-corner-bracket top-right"></div>
            <div className="hud-corner-bracket bottom-left"></div>
            <div className="hud-corner-bracket bottom-right"></div>

            <div className="hud-panel-inner">
              <div className="panel-depth-lines" aria-hidden="true"><span></span><span></span><span></span></div>
              <header className="auth-header">
                {/* Clean SaaS Logo */}
                <div className="brand-logo-container">
                  <motion.div 
                    className="logo-badge"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <Activity size={24} className="text-cyan" />
                  </motion.div>
                  <span className="brand-logo-text">MedChain<span className="text-cyan"> EHR</span></span>
                </div>
                
                <h1 className="auth-title">
                  Welcome back
                </h1>
                <p className="auth-subtitle">
                  Sign in to continue to your secure healthcare workspace.
                </p>
              </header>

              <div className="session-card">
                <div>
                  <span>Session protection</span>
                  <strong>Encrypted tunnel active</strong>
                </div>
                <div className="session-bars"><i></i><i></i><i></i></div>
              </div>

              <div className="form-wrapper">
                {isLoading && <div className="loading-line"></div>}
                
                <form onSubmit={handleLogin} className="login-form">
                  <div className="form-group">
                    <label className="form-label font-mono">Email address</label>
                    <div className="input-container">
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="admin@ehr.local"
                        className="input-lume has-icon"
                      />
                      <Mail className="input-icon" size={16} />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="form-label-row">
                      <label className="form-label font-mono">Password</label>
                      <Link to="/login" onClick={(e) => { e.preventDefault(); alert('In a production system, this triggers a decentralized recovery process using multisig credentials.'); }} className="forgot-pass-link font-mono">
                        Forgot password?
                      </Link>
                    </div>
                    
                    <div className="input-container">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="input-lume has-icon"
                      />
                      <Lock className="input-icon" size={16} />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      className="error-lume font-mono"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <ShieldAlert size={14} style={{ marginRight: '6px' }} />
                      {error}
                    </motion.div>
                  )}

                  <motion.button 
                    type="submit" 
                    className="btn-lume w-full justify-center hud-btn font-mono"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                    {isLoading ? 'Signing in...' : 'Sign in securely'}
                  </motion.button>
                </form>

                {/* HIPAA Ready Encrypted Badge */}
                <div className="security-badge-container font-mono">
                  <div className="badge-pill">
                    <Shield size={12} className="text-cyan" />
                    <span>HIPAA-ready encrypted access</span>
                  </div>
                </div>

                {/* Subdued Dev Login Helper */}
                <div className="dev-sandbox-section">
                  <button 
                    type="button" 
                    className="dev-toggle-trigger font-mono"
                    onClick={() => setShowDevPanel(!showDevPanel)}
                  >
                    <span>{showDevPanel ? 'v' : '>'} Demo accounts</span>
                  </button>
                  
                  {showDevPanel && (
                    <motion.div 
                      className="dev-grid"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                    >
                      {[
                        { role: 'admin' as const, label: 'Admin', icon: <Terminal size={14} /> },
                        { role: 'doctor' as const, label: 'Doctor', icon: <Stethoscope size={14} /> },
                        { role: 'patient' as const, label: 'Patient', icon: <User size={14} /> }
                      ].map((item) => (
                        <button 
                          key={item.role}
                          type="button"
                          onClick={() => loginAs(item.role)} 
                          className="dev-bypass-btn font-mono"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="auth-switch-box font-mono">
                <p className="auth-switch">
                  New here? <Link to="/register" className="link-lume">Create an account</Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
