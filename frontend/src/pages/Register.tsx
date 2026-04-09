import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Loader2
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
    role: 'patient' as 'patient' | 'doctor' | 'admin'
  });
  const [error, setError] = useState<string | null>(null);
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
      setError(err.message || 'Enrollment failed. Please check your parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <div className="logo-lume">
            <Shield size={28} />
          </div>
          <h1 className="auth-title">CHANNEL <span className="text-cyan">ENROLLMENT</span></h1>
          <div className="auth-subtitle">MSP Identity Provisioning</div>
        </header>

        <div className="lume-panel overflow-hidden">
          {isLoading && <div className="loading-line"></div>}
          
          <div style={{ padding: '2rem' }}>
            <form onSubmit={handleRegister} className="register-grid">
              
              <div className="form-group">
                <label className="form-label">Identity ID (Email)</label>
                <div className="input-container">
                  <input 
                    name="email" type="email" required
                    value={formData.email} onChange={handleInputChange}
                    placeholder="entity@ehr.local" className="input-lume has-icon"
                  />
                  <Mail className="input-icon" size={16} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Secret Cipher</label>
                <div className="input-container">
                  <input 
                    name="password" type="password" required
                    value={formData.password} onChange={handleInputChange}
                    placeholder="••••••••" className="input-lume has-icon"
                  />
                  <Lock className="input-icon" size={16} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Legal Name</label>
                <div className="input-container">
                  <input 
                    name="name" type="text" required
                    value={formData.name} onChange={handleInputChange}
                    placeholder="Cipher Name" className="input-lume has-icon"
                  />
                  <User className="input-icon" size={16} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Genesis Date (DOB)</label>
                <div className="input-container">
                  <input 
                    name="dob" type="date" required
                    value={formData.dob} onChange={handleInputChange}
                    className="input-lume has-icon"
                  />
                  <Calendar className="input-icon" size={16} />
                </div>
              </div>

              <div className="form-group">
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
              </div>

              <div className="form-group">
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
              </div>

              <div className="form-group">
                <label className="form-label">Hematology (Blood)</label>
                <div className="input-container">
                  <input 
                    name="bloodGroup" type="text"
                    value={formData.bloodGroup} onChange={handleInputChange}
                    placeholder="e.g. O+" className="input-lume has-icon"
                  />
                  <Droplets className="input-icon" size={16} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Relay Contact (Emergency)</label>
                <div className="input-container">
                  <input 
                    name="emergencyContact" type="tel"
                    value={formData.emergencyContact} onChange={handleInputChange}
                    placeholder="+91-0000000000" className="input-lume has-icon"
                  />
                  <Phone className="input-icon" size={16} />
                </div>
              </div>

              {error && (
                <div className="error-lume full-width">
                  PROVISION_ERROR: {error}
                </div>
              )}

              <div className="full-width mt-4">
                <button 
                  type="submit" 
                  className="btn-lume w-full justify-center"
                  disabled={isLoading}
                >
                  {!isLoading ? <CheckCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
                  {isLoading ? 'Provisioning...' : 'Complete Enrollment'}
                </button>
              </div>
            </form>
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
      </div>
    </div>
  );
};

export default Register;
