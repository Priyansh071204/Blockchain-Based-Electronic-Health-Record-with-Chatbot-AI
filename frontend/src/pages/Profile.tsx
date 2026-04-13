import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import { 
  User, 
  Shield, 
  Key, 
  Lock, 
  Globe, 
  Fingerprint, 
  Mail, 
  ShieldCheck,
  Cpu,
  RefreshCcw,
  ExternalLink
} from 'lucide-react';
import './Profile.css';

const Profile: React.FC = () => {
  const { user } = useAuth();

  const securityDetails = [
    { label: 'Role Authority', value: user?.role?.toUpperCase() || 'SUBJECT', icon: <Shield size={16} /> },
    { label: 'Entity Identifier', value: user?.entityId || 'PENDING_PROVISION', icon: <Cpu size={16} /> },
    { label: 'MSP Credential', value: 'FABRIC_CLI_MSP_V2', icon: <Key size={16} /> },
    { label: 'Encryption Protocol', value: 'AES_256_GCM_RSA_4096', icon: <Lock size={16} /> }
  ];

  const cryptographicKeys = [
    { name: 'Public PGP Key', hash: '0xBD2...F91A', status: 'ACTIVE' },
    { name: 'MSP Signature Key', hash: '0x7C1...E202', status: 'VERIFIED' },
    { name: 'IPFS Content CID', hash: 'QmY8s...z4n1', status: 'SYNCHRONIZED' }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PageTransition>
      <div className="profile-page p-8">
        <div className="profile-container">
          <motion.header 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ marginBottom: '2.5rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="badge-lume pulse-lume" style={{ color: '#a855f7' }}>Identity State: Encrypted</span>
              <span className="metric-label" style={{ color: 'var(--text-dim)' }}>X.509_CERTIFICATE_AUTHORIZED</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>User <span className="text-cyan">Profile</span></h1>
            <p className="text-dim">Cryptographic subject identity and membership service credentials.</p>
          </motion.header>

          <motion.div 
            className="lume-panel profile-header-card scanline flare-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
            }}
          >
            <div className="profile-avatar-large">
              <User size={64} />
              <div className="avatar-scanline"></div>
            </div>
            
            <div className="profile-info-primary">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {user?.name || 'Anonymous Subject'}
              </motion.h1>
              <div className="msp-id-chip">
                <Fingerprint size={14} className="text-cyan" />
                <span>MSP::{user?.entityId || 'TEMP_ID'}::CHANNEL_01</span>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                  <Mail size={14} />
                  <span>{user?.email || 'unattached@ehr.local'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                  <Globe size={14} />
                  <span>Zone: US-EAST-FABRIC</span>
                </div>
              </div>
            </div>
            
            <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-lume" 
                style={{ height: '40px', padding: '0 1.25rem', fontSize: '10px' }}
              >
                <RefreshCcw size={14} />
                <span>Rotate Identity</span>
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            className="details-grid"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div 
              variants={item} 
              className="lume-panel detail-item flare-card"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
            >
              <div className="detail-label">Medical Service Provider Context</div>
              <div className="security-logs" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {securityDetails.map((detail, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ x: 5, background: 'rgba(255,255,255,0.03)' }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-thin)', transition: 'background 0.2s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                      {detail.icon}
                      <span>{detail.label}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--lume-cyan)' }}>{detail.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              variants={item} 
              className="lume-panel detail-item flare-card"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
            >
              <div className="detail-label">Distributed State Verification</div>
              <div style={{ marginTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)' }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ShieldCheck size={48} className="text-cyan" style={{ opacity: 0.5 }} />
                </motion.div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>100% SECURE</span>
                  <p className="text-dim" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>No unauthorized ledger access detected in last 30 days.</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="icon-btn" 
                  style={{ fontSize: '10px', padding: '0.5rem 1rem', width: 'auto' }}
                >
                  <span>View Full Audit Trail</span>
                  <ExternalLink size={12} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="security-summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="detail-label" style={{ color: 'var(--lume-violet)' }}>Cryptographic Key Hierarchy</div>
            <div className="key-list">
              {cryptographicKeys.map((key, idx) => (
                <motion.div 
                  key={idx} 
                  className="key-item"
                  whileHover={{ x: 5 }}
                >
                  <div className="key-meta">
                    <span className="key-name">{key.name}</span>
                    <span className="key-hash">{key.hash}</span>
                  </div>
                  <span className="badge-lume" style={{ fontSize: '8px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: 'none' }}>{key.status}</span>
                </motion.div>
              ))}
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
              <Lock size={16} />
              <span>These keys are stored in your browser's secure hardware enclave and never touch the server unencrypted.</span>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Profile;

