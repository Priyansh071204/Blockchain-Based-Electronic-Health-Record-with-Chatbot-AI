import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import Medical3DBackground from '../components/Medical3DBackground';
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Calendar, 
  Users, 
  Droplets, 
  Phone,
  Loader2,
  Eye,
  EyeOff,
  Stethoscope,
  Activity,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import './Register.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dob: '',
    gender: 'Other',
    bloodGroup: '',
    emergencyContact: '',
    role: 'patient' as 'patient' | 'doctor' | 'admin',
    specialization: '',
    licenseNumber: '',
    hospital: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      await register(formData);
      const destMap: Record<string, string> = { 
        admin: '/admin', 
        doctor: '/doctor', 
        patient: '/patient' 
      };
      navigate(destMap[formData.role] || '/');
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors);
      }
      setError(err.message || 'Enrollment failed. Please check your parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PageTransition>
      <div className="auth-page font-main">
        {/* Modern 3D Canvas Background */}
        <Medical3DBackground />
        
        {/* Subtle overlay elements for lighting */}
        <div className="auth-glow-overlay" />
        <div className="scanline" />

        <div className="login-portal-wrapper" style={{ maxWidth: '1200px' }}>
          {/* Left Hero Branding Side */}
          <div className="hero-branding-side">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="branding-content"
            >
              <div className="pulse-tag">
                <span className="pulse-dot"></span>
                <span className="pulse-text font-mono">MSP IDENTITY PROVISIONING</span>
              </div>
              <h2 className="branding-title">
                Secure Portal <span className="gradient-text">Enrollment</span>
              </h2>
              <p className="branding-desc">
                Register as a Provider, Patient, or Administrator on the MedChain network. Initiate your local cryptographic key pairs for decentralised identity checking.
              </p>
            </motion.div>
          </div>

          {/* Right glassmorphic register panel */}
          <motion.div 
            className="auth-card-panel glass-panel hud-panel"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 90 }}
            style={{ maxWidth: '540px' }}
          >
            {/* Tech Corner Overlays */}
            <div className="hud-corner-bracket top-left"></div>
            <div className="hud-corner-bracket top-right"></div>
            <div className="hud-corner-bracket bottom-left"></div>
            <div className="hud-corner-bracket bottom-right"></div>

            <div className="hud-panel-inner">
              <header className="auth-header" style={{ marginBottom: '1.5rem' }}>
                {/* Clean SaaS Logo */}
                <div className="brand-logo-container">
                  <div className="logo-badge">
                    <Activity size={24} className="text-cyan" />
                  </div>
                  <span className="brand-logo-text">MedChain<span className="text-cyan">.EHR</span></span>
                </div>
                
                <h1 className="auth-title" style={{ fontSize: '1.5rem' }}>
                  Enroll Identity
                </h1>
                <p className="auth-subtitle">
                  Provision new cryptographic EHR access credentials
                </p>
              </header>

              <div className="form-wrapper">
                {isLoading && <div className="loading-line"></div>}
                
                <motion.form 
                  onSubmit={handleRegister} 
                  className="register-grid"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  <motion.div variants={item} className="form-group">
                    <label className="form-label font-mono">IDENTITY EMAIL (LOGIN ID)</label>
                    <div className="input-container">
                      <input 
                        name="email" type="email" required
                        value={formData.email} onChange={handleInputChange}
                        placeholder="name@medchain.com" className={`input-lume has-icon ${fieldErrors.email ? 'has-error' : ''}`}
                      />
                      <Mail className="input-icon" size={14} />
                    </div>
                    {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
                  </motion.div>

                  <motion.div variants={item} className="form-group">
                    <label className="form-label font-mono">SECRET CIPHER (PASSWORD)</label>
                    <div className="input-container">
                      <input 
                        name="password" type={showPassword ? 'text' : 'password'} required
                        value={formData.password} onChange={handleInputChange}
                        placeholder="••••••••" className={`input-lume has-icon ${fieldErrors.password ? 'has-error' : ''}`}
                      />
                      <Lock className="input-icon" size={14} />
                      <button 
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {fieldErrors.password && <span className="field-error-text">{fieldErrors.password}</span>}
                  </motion.div>

                  <motion.div variants={item} className="form-group">
                    <label className="form-label font-mono">LEGAL FULL NAME</label>
                    <div className="input-container">
                      <input 
                        name="name" type="text" required
                        value={formData.name} onChange={handleInputChange}
                        placeholder="Dr. John Doe" className={`input-lume has-icon ${fieldErrors.name ? 'has-error' : ''}`}
                      />
                      <User className="input-icon" size={14} />
                    </div>
                    {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
                  </motion.div>

                  <motion.div variants={item} className="form-group">
                    <label className="form-label font-mono">GENESIS DATE (DOB)</label>
                    <div className="input-container">
                      <input 
                        name="dob" type="date" required
                        value={formData.dob} onChange={handleInputChange}
                        className={`input-lume has-icon ${fieldErrors.dob ? 'has-error' : ''}`}
                        style={{ colorScheme: 'dark' }}
                      />
                      <Calendar className="input-icon" size={14} />
                    </div>
                    {fieldErrors.dob && <span className="field-error-text">{fieldErrors.dob}</span>}
                  </motion.div>

                  <motion.div variants={item} className="form-group">
                    <label className="form-label font-mono">SYSTEM ACCESS ROLE</label>
                    <div className="input-container">
                      <select 
                        name="role" value={formData.role} onChange={handleInputChange}
                        className="input-lume has-icon select-lume"
                        style={{ appearance: 'none' }}
                      >
                        <option value="patient">Patient Identity</option>
                        <option value="doctor">Medical Practitioner</option>
                        <option value="admin">Network Admin</option>
                      </select>
                      <Users className="input-icon" size={14} />
                      <div className="select-arrow">▼</div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="form-group">
                    <label className="form-label font-mono">BIOLOGICAL GENDER</label>
                    <div className="input-container">
                      <select 
                        name="gender" value={formData.gender} onChange={handleInputChange}
                        className="input-lume has-icon select-lume"
                        style={{ appearance: 'none' }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <User className="input-icon" size={14} />
                      <div className="select-arrow">▼</div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="form-group">
                    <label className="form-label font-mono">BLOOD GROUP</label>
                    <div className="input-container">
                      <input 
                        name="bloodGroup" type="text"
                        value={formData.bloodGroup} onChange={handleInputChange}
                        placeholder="O+ / AB-" className={`input-lume has-icon ${fieldErrors.bloodGroup ? 'has-error' : ''}`}
                      />
                      <Droplets className="input-icon" size={14} />
                    </div>
                    {fieldErrors.bloodGroup && <span className="field-error-text">{fieldErrors.bloodGroup}</span>}
                  </motion.div>

                  <motion.div variants={item} className="form-group">
                    <label className="form-label font-mono">EMERGENCY PHONE RELAY</label>
                    <div className="input-container">
                      <input 
                        name="emergencyContact" type="tel"
                        value={formData.emergencyContact} onChange={handleInputChange}
                        placeholder="+1 (555) 019-2834" className={`input-lume has-icon ${fieldErrors.emergencyContact ? 'has-error' : ''}`}
                      />
                      <Phone className="input-icon" size={14} />
                    </div>
                    {fieldErrors.emergencyContact && <span className="field-error-text">{fieldErrors.emergencyContact}</span>}
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {formData.role === 'doctor' && (
                      <motion.div 
                        key="doctor-fields"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '0.75rem' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="form-group full-width" 
                        style={{ padding: '0.75rem', background: 'rgba(20, 184, 166, 0.03)', border: '1px solid rgba(20, 184, 166, 0.15)', borderRadius: 'var(--radius-sharp)', overflow: 'hidden' }}
                      >
                        <div className="form-label font-mono" style={{ color: 'var(--lume-cyan)', fontSize: '0.55rem', fontWeight: 800 }}>
                          PRACTITIONER VERIFICATION CREDENTIALS
                        </div>
                        <div className="register-grid" style={{ marginTop: '0.75rem', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label className="form-label font-mono">SPECIALIZATION</label>
                            <div className="input-container">
                              <input 
                                name="specialization" type="text" required
                                value={formData.specialization} onChange={handleInputChange}
                                placeholder="e.g. Cardiology" className={`input-lume has-icon ${fieldErrors.specialization ? 'has-error' : ''}`}
                              />
                              <Stethoscope className="input-icon" size={14} />
                            </div>
                            {fieldErrors.specialization && <span className="field-error-text">{fieldErrors.specialization}</span>}
                          </div>

                          <div className="form-group">
                            <label className="form-label font-mono">LICENSE NUMBER</label>
                            <div className="input-container">
                              <input 
                                name="licenseNumber" type="text" required
                                value={formData.licenseNumber} onChange={handleInputChange}
                                placeholder="MED-99201" className={`input-lume has-icon ${fieldErrors.licenseNumber ? 'has-error' : ''}`}
                              />
                              <Lock className="input-icon" size={14} />
                            </div>
                            {fieldErrors.licenseNumber && <span className="field-error-text">{fieldErrors.licenseNumber}</span>}
                          </div>

                          <div className="form-group full-width">
                            <label className="form-label font-mono">PRIMARY CLINICAL AFFILIATION</label>
                            <div className="input-container">
                              <input 
                                name="hospital" type="text" required
                                value={formData.hospital} onChange={handleInputChange}
                                placeholder="St. Mary's General Hospital" className={`input-lume has-icon ${fieldErrors.hospital ? 'has-error' : ''}`}
                              />
                              <Shield className="input-icon" size={14} />
                            </div>
                            {fieldErrors.hospital && <span className="field-error-text">{fieldErrors.hospital}</span>}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="error-lume full-width font-mono"
                        style={{ marginTop: '0.5rem' }}
                      >
                        <ShieldAlert size={14} style={{ marginRight: '6px' }} />
                        ENROLL_ERROR: {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={item} className="full-width" style={{ marginTop: '0.5rem' }}>
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit" 
                      className="btn-lume w-full justify-center hud-btn font-mono"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                      {isLoading ? 'ENROLLING PORTAL IDENTITY...' : 'ENROLL NOW'}
                    </motion.button>
                  </motion.div>
                </motion.form>

                {/* HIPAA Ready Encrypted Badge */}
                <div className="security-badge-container font-mono" style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>
                  <div className="badge-pill">
                    <Shield size={12} className="text-cyan" />
                    <span>HIPAA-READY ENCRYPTED ACCESS</span>
                  </div>
                </div>
              </div>

              <div className="auth-switch-box font-mono" style={{ marginTop: '1rem' }}>
                <p className="auth-switch">
                  ALREADY PROVISIONED? <Link to="/login" className="link-lume">SIGN IN</Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;
