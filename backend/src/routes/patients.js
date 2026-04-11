'use strict';

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { submitTransaction, evaluateTransaction } = require('../config/fabric');
const { authenticate } = require('../middleware/auth');
const logger = require('../config/logger');

router.use(authenticate);

const ok = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ errors: e.array() });
  next();
};

router.use((req, res, next) => {
  logger.info(`[AUTH] User: ${req.user.email} | ID: ${req.user.id} | Entity: ${req.user.entityId} | Role: ${req.user.role}`);
  next();
});

// ── "MY" SHORTCUTS (Must be before parameterized routes) ─────────────────────

router.get('/my/records', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatientRecords', req.user.entityId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

router.get('/my/appointments', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatientAppointments', req.user.entityId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

router.get('/my/billing', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatientBilling', req.user.entityId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

router.get('/my/vitals', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatientVitals', req.user.entityId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

router.get('/my/prescriptions', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatientPrescriptions', req.user.entityId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

router.get('/my/audit', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getAuditTrail', req.user.entityId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

// ── PATIENT REGISTRATION ───────────────────────────────────────────────────

router.post('/register',
  body('patientId').trim().notEmpty(),
  body('name').trim().notEmpty(),
  body('dob').notEmpty(),
  body('gender').isIn(['Male', 'Female', 'Other']),
  body('bloodGroup').notEmpty(),
  body('emergencyContact').notEmpty(),
  ok,
  async (req, res, next) => {
    try {
      const { patientId, name, dob, gender, bloodGroup, emergencyContact } = req.body;
      const result = await submitTransaction(
        'registerPatient',
        patientId, name, dob, gender, bloodGroup, emergencyContact, req.user.role
      );
      res.status(201).json(result);
    } catch (err) {
      if (err.message.includes('already exists')) return res.status(409).json({ error: err.message });
      next(err);
    }
  }
);

// ── PARAMETERIZED ROUTES ────────────────────────────────────────────────────

router.get('/:patientId', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatient', req.params.patientId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('does not exist'))
      return res.status(404).json({ error: err.message });
    if (err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('access denied'))
      return res.status(403).json({ error: err.message });
    next(err);
  }
});

router.post('/:patientId/access/grant',
  body('doctorId').trim().notEmpty(),
  ok,
  async (req, res, next) => {
    try {
      const { doctorId, expiresAt } = req.body;
      const r = await submitTransaction(
        'grantDoctorAccess',
        req.params.patientId, doctorId, expiresAt || '',
        req.user.entityId, req.user.role
      );
      res.json(r);
    } catch (err) {
      if (err.message.toLowerCase().includes('unauthorized')) return res.status(403).json({ error: err.message });
      next(err);
    }
  }
);

router.post('/:patientId/access/revoke',
  body('doctorId').trim().notEmpty(),
  ok,
  async (req, res, next) => {
    try {
      const { doctorId } = req.body;
      const r = await submitTransaction(
        'revokeDoctorAccess',
        req.params.patientId, doctorId,
        req.user.entityId, req.user.role
      );
      res.json(r);
    } catch (err) {
      if (err.message.toLowerCase().includes('unauthorized')) return res.status(403).json({ error: err.message });
      next(err);
    }
  }
);

router.get('/:patientId/records', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatientRecords', req.params.patientId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) {
    if (err.message.toLowerCase().includes('access denied')) return res.status(403).json({ error: err.message });
    next(err);
  }
});

router.get('/:patientId/prescriptions', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatientPrescriptions', req.params.patientId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) {
    next(err);
  }
});

router.get('/:patientId/audit', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getAuditTrail', req.params.patientId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

router.get('/:patientId/appointments', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatientAppointments', req.params.patientId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

router.get('/:patientId/billing', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPatientBilling', req.params.patientId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

module.exports = router;
