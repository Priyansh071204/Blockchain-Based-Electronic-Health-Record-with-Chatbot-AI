'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { submitTransaction } = require('../config/fabric');

// In-memory store – swap with PostgreSQL/MongoDB in production
const users = new Map();

// ── Seed demo accounts on startup ──────────────────────────────────────────────
// ── Seed demo accounts on startup ──────────────────────────────────────────────
const seedPromise = (async () => {
  const adminHash = await bcrypt.hash('Admin@123', 12);
  users.set('admin_001', {
    id: 'admin_001', email: 'admin@ehr.local', passwordHash: adminHash,
    role: 'admin', entityId: 'admin_001', name: 'System Admin',
    createdAt: new Date().toISOString(), active: true,
  });

  const doctorHash = await bcrypt.hash('Doctor@123', 12);
  users.set('doctor_001', {
    id: 'doctor_001', email: 'doctor@ehr.local', passwordHash: doctorHash,
    role: 'doctor', entityId: 'DOC001', name: 'Dr. Sarah Smith',
    createdAt: new Date().toISOString(), active: true,
  });

  const patientHash = await bcrypt.hash('Patient@123', 12);
  users.set('patient_001', {
    id: 'patient_001', email: 'patient@ehr.local', passwordHash: patientHash,
    role: 'patient', entityId: 'PAT001', name: 'John Doe',
    createdAt: new Date().toISOString(), active: true,
  });

  logger.info('Demo accounts seeded:');
  logger.info('  → Admin:   admin@ehr.local / Admin@123');
  logger.info('  → Doctor:  doctor@ehr.local / Doctor@123');
  logger.info('  → Patient: patient@ehr.local / Patient@123');
})();

// ── Helpers ───────────────────────────────────────────────────────────────────
function sign(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, entityId: user.entityId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

function signRefresh(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
}

function sanitize(u) {
  const { passwordHash, ...safe } = u;
  return safe;
}

// ── Public API ────────────────────────────────────────────────────────────────
async function register(data) {
  const { email, password, role, entityId, name } = data;
  if ([...users.values()].find(u => u.email === email))
    throw Object.assign(new Error('Email already registered'), { status: 409 });

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id, email, passwordHash, role,
    entityId: entityId || id, name,
    createdAt: new Date().toISOString(), active: true,
  };
  users.set(id, user);
  logger.info(`Registered ${role}: ${email}`);

  // Provision onto Blockchain Ledger
  try {
    if (role === 'doctor') {
      await submitTransaction(
        'registerDoctor',
        id, // entityId
        name,
        data.specialization || 'General',
        data.licenseNumber || 'PENDING',
        data.hospital || 'Unassigned',
        'admin' // callerRole (system impersonating admin)
      );
    } else if (role === 'patient') {
      await submitTransaction(
        'registerPatient',
        id,
        name,
        data.dob || '1970-01-01',
        data.gender || 'Other',
        data.bloodGroup || 'NA',
        data.emergencyContact || 'NA',
        'admin' // callerRole
      );
    }
  } catch (ledgerErr) {
    logger.error(`Blockchain registration failed for ${email}: ${ledgerErr.message}`);
    // We keep the user record in authService so they can at least log in, 
    // but the admin will see they aren't on the ledger.
  }

  return sanitize(user);
}

async function login({ email, password }) {
  const user = [...users.values()].find(u => u.email === email);
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  if (!user.active) throw Object.assign(new Error('Account deactivated'), { status: 403 });
  if (!await bcrypt.compare(password, user.passwordHash))
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  logger.info(`Login: ${email} [${user.role}]`);
  return { user: sanitize(user), token: sign(user), refreshToken: signRefresh(user) };
}

async function refresh(refreshToken) {
  let decoded;
  try { decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
  catch { throw Object.assign(new Error('Invalid refresh token'), { status: 401 }); }

  const user = users.get(decoded.id);
  if (!user || !user.active)
    throw Object.assign(new Error('User not found'), { status: 401 });
  return { token: sign(user) };
}

function getById(id) {
  const u = users.get(id);
  if (!u) throw Object.assign(new Error('User not found'), { status: 404 });
  return sanitize(u);
}

function getAll() { return [...users.values()].map(sanitize); }

function getByEntityId(entityId) {
  const u = [...users.values()].find(u => u.entityId === entityId);
  return u ? sanitize(u) : null;
}

module.exports = { register, login, refresh, getById, getAll, getByEntityId, seedPromise };
