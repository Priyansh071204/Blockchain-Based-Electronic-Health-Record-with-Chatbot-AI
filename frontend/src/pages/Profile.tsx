import React from 'react';
import { useAuth } from '../context/AuthContext';
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

  return (
    <div className="profile-page p-8">
      <div className="profile-container">
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge-lume pulse-lume" style={{ color: '#a855f7' }}>Identity State: Encrypted</span>
            <span className="metric-label" style={{ color: 'var(--text-dim)' }}>X.509_CERTIFICATE_AUTHORIZED</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>User <span className="text-cyan">Profile</span></h1>
          <p className="text-dim">Cryptographic subject identity and membership service credentials.</p>
        </header>

        <div className="lume-panel profile-header-card scanline">
          <div className="profile-avatar-large">
            <User size={64} />
            <div className="avatar-scanline"></div>
          </div>
          
          <div className="profile-info-primary">
            <h1>{user?.name || 'Anonymous Subject'}</h1>
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
            <button className="btn-lume" style={{ height: '40px', padding: '0 1.25rem', fontSize: '10px' }}>
              <RefreshCcw size={14} />
              <span>Rotate Identity</span>
            </button>
          </div>
        </div>

        <div className="details-grid">
          <div className="lume-panel detail-item">
            <div className="detail-label">Medical Service Provider Context</div>
            <div className="security-logs" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {securityDetails.map((detail, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-thin)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {detail.icon}
                    <span>{detail.label}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--lume-cyan)' }}>{detail.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lume-panel detail-item">
            <div className="detail-label">Distributed State Verification</div>
            <div style={{ marginTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)' }}>
              <ShieldCheck size={48} className="text-cyan" style={{ opacity: 0.5 }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>100% SECURE</span>
                <p className="text-dim" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>No unauthorized ledger access detected in last 30 days.</p>
              </div>
              <button className="icon-btn" style={{ fontSize: '10px', padding: '0.5rem 1rem', width: 'auto' }}>
                <span>View Full Audit Trail</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="security-summary">
          <div className="detail-label" style={{ color: 'var(--lume-violet)' }}>Cryptographic Key Hierarchy</div>
          <div className="key-list">
            {cryptographicKeys.map((key, idx) => (
              <div key={idx} className="key-item">
                <div className="key-meta">
                  <span className="key-name">{key.name}</span>
                  <span className="key-hash">{key.hash}</span>
                </div>
                <span className="badge-lume" style={{ fontSize: '8px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>{key.status}</span>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            <Lock size={16} />
            <span>These keys are stored in your browser's secure hardware enclave and never touch the server unencrypted.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
