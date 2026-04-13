import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Calendar, 
  Users, 
  Droplets, 
  Phone,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Stethoscope
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
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PageTransition>
      <div className="auth-page">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="auth-header">
            <motion.div 
              className="logo-lume"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.8 }}
            >
              <Shield size={28} />
            </motion.div>
            <h1 className="auth-title">CHANNEL <span className="text-cyan">ENROLLMENT</span></h1>
            <div className="auth-subtitle">MSP Identity Provisioning</div>
          </header>

          <div className="lume-panel overflow-hidden">
            {isLoading && <div className="loading-line"></div>}
            
            <div style={{ padding: '2rem' }}>
              <motion.form 
                onSubmit={handleRegister} 
                className="register-grid"
                variants={container}
                initial="hidden"
                animate="show"
              >
                
                <motion.div variants={item} className="form-group">
                  <label className="form-label">Identity ID (Email)</label>
                  <div className="input-container">
                    <input 
                      name="email" type="email" required
                      value={formData.email} onChange={handleInputChange}
                      placeholder="entity@ehr.local" className={`input-lume has-icon ${fieldErrors.email ? 'has-error' : ''}`}
                    />
                    <Mail className="input-icon" size={16} />
                  </div>
                  {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
                </motion.div>

                <motion.div variants={item} className="form-group">
                  <label className="form-label">Secret Cipher</label>
                  <div className="input-container">
                    <input 
                      name="password" type={showPassword ? 'text' : 'password'} required
                      value={formData.password} onChange={handleInputChange}
                      placeholder="••••••••" className={`input-lume has-icon ${fieldErrors.password ? 'has-error' : ''}`}
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
                  {fieldErrors.password && <span className="field-error-text">{fieldErrors.password}</span>}
                </motion.div>

                <motion.div variants={item} className="form-group">
                  <label className="form-label">Legal Name</label>
                  <div className="input-container">
                    <input 
                      name="name" type="text" required
                      value={formData.name} onChange={handleInputChange}
                      placeholder="Cipher Name" className={`input-lume has-icon ${fieldErrors.name ? 'has-error' : ''}`}
                    />
                    <User className="input-icon" size={16} />
                  </div>
                  {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
                </motion.div>

                <motion.div variants={item} className="form-group">
                  <label className="form-label">Genesis Date (DOB)</label>
                  <div className="input-container">
                    <input 
                      name="dob" type="date" required
                      value={formData.dob} onChange={handleInputChange}
                      className={`input-lume has-icon ${fieldErrors.dob ? 'has-error' : ''}`}
                    />
                    <Calendar className="input-icon" size={16} />
                  </div>
                  {fieldErrors.dob && <span className="field-error-text">{fieldErrors.dob}</span>}
                </motion.div>

                <motion.div variants={item} className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <div className="input-container">
                    <select 
                      name="role" value={formData.role} onChange={handleInputChange}
                      className="input-lume has-icon"
                    >
                      <option value="patient">Patient Identity</option>
                      <option value="doctor">Medical Practitioner</option>
                      <option value="admin">Network Admin</option>
                    </select>
                    <Users className="input-icon" size={16} />
                  </div>
                </motion.div>

                <motion.div variants={item} className="form-group">
                  <label className="form-label">Biological Unit (Gender)</label>
                  <div className="input-container">
                    <select 
                      name="gender" value={formData.gender} onChange={handleInputChange}
                      className="input-lume has-icon"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <User className="input-icon" size={16} />
                  </div>
                </motion.div>

                <motion.div variants={item} className="form-group">
                  <label className="form-label">Hematology (Blood)</label>
                  <div className="input-container">
                    <input 
                      name="bloodGroup" type="text"
                      value={formData.bloodGroup} onChange={handleInputChange}
                      placeholder="e.g. O+" className={`input-lume has-icon ${fieldErrors.bloodGroup ? 'has-error' : ''}`}
                    />
                    <Droplets className="input-icon" size={16} />
                  </div>
                  {fieldErrors.bloodGroup && <span className="field-error-text">{fieldErrors.bloodGroup}</span>}
                </motion.div>

                <motion.div variants={item} className="form-group">
                  <label className="form-label">Relay Contact (Emergency)</label>
                  <div className="input-container">
                    <input 
                      name="emergencyContact" type="tel"
                      value={formData.emergencyContact} onChange={handleInputChange}
                      placeholder="+91-0000000000" className={`input-lume has-icon ${fieldErrors.emergencyContact ? 'has-error' : ''}`}
                    />
                    <Phone className="input-icon" size={16} />
                  </div>
                  {fieldErrors.emergencyContact && <span className="field-error-text">{fieldErrors.emergencyContact}</span>}
                </motion.div>

                <AnimatePresence>
                  {formData.role === 'doctor' && (
                    <motion.div 
                      key="doctor-fields"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="form-group full-width" 
                      style={{ padding: '1rem', background: 'rgba(0, 242, 255, 0.02)', border: '1px solid rgba(0, 242, 255, 0.1)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
                    >
                      <div className="form-label" style={{ color: 'var(--lume-cyan)' }}>Medical Practitioner Credentials</div>
                      <div className="register-grid" style={{ marginTop: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Specialization</label>
                          <div className="input-container">
                            <input 
                              name="specialization" type="text" required
                              value={formData.specialization} onChange={handleInputChange}
                              placeholder="e.g. Cardiology" className={`input-lume has-icon ${fieldErrors.specialization ? 'has-error' : ''}`}
                            />
                            <Stethoscope className="input-icon" size={16} />
                          </div>
                          {fieldErrors.specialization && <span className="field-error-text">{fieldErrors.specialization}</span>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">License Number</label>
                          <div className="input-container">
                            <input 
                              name="licenseNumber" type="text" required
                              value={formData.licenseNumber} onChange={handleInputChange}
                              placeholder="MED-XXXXXX" className={`input-lume has-icon ${fieldErrors.licenseNumber ? 'has-error' : ''}`}
                            />
                            <Lock className="input-icon" size={16} />
                          </div>
                          {fieldErrors.licenseNumber && <span className="field-error-text">{fieldErrors.licenseNumber}</span>}
                        </div>

                        <div className="form-group full-width">
                          <label className="form-label">Primary Hospital / Clinic</label>
                          <div className="input-container">
                            <input 
                              name="hospital" type="text" required
                              value={formData.hospital} onChange={handleInputChange}
                              placeholder="City Medical Center" className={`input-lume has-icon ${fieldErrors.hospital ? 'has-error' : ''}`}
                            />
                            <Shield className="input-icon" size={16} />
                          </div>
                          {fieldErrors.hospital && <span className="field-error-text">{fieldErrors.hospital}</span>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="error-lume full-width"
                    >
                      PROVISION_ERROR: {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={item} className="full-width mt-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="btn-lume w-full justify-center"
                    disabled={isLoading}
                  >
                    {!isLoading ? <CheckCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
                    {isLoading ? 'Provisioning...' : 'Complete Enrollment'}
                  </motion.button>
                </motion.div>
              </motion.form>
            </div>

            <div 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.01)', 
                padding: '1.25rem', 
                borderTop: '1px solid var(--border-thin)',
                textAlign: 'center'
              }}
            >
              <p className="auth-switch">
                Already enrolled? <Link to="/login" className="link-lume">Authorize Session</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Register;

