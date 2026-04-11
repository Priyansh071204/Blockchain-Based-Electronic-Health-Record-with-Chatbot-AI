'use strict';

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { submitTransaction, evaluateTransaction } = require('../config/fabric');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

const ok = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ errors: e.array() });
  next();
};

// GET /api/doctors/my/patients
router.get('/my/patients', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getDoctorPatients', req.user.entityId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

// GET /api/doctors/my/records
router.get('/my/records', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('queryRecordsByDoctor', req.user.entityId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

// POST /api/doctors/register  (admin only)
router.post('/register',
  requireRole('admin'),
  body('doctorId').trim().notEmpty(),
  body('name').trim().notEmpty(),
  body('specialization').trim().notEmpty(),
  body('licenseNumber').trim().notEmpty(),
  body('hospital').trim().notEmpty(),
  ok,
  async (req, res, next) => {
    try {
      const { doctorId, name, specialization, licenseNumber, hospital } = req.body;
      const r = await submitTransaction(
        'registerDoctor',
        doctorId, name, specialization, licenseNumber, hospital, req.user.role
      );
      res.status(201).json(r);
    } catch (err) {
      if (err.message.includes('already exists')) return res.status(409).json({ error: err.message });
      next(err);
    }
  }
);

// GET /api/doctors/:doctorId
router.get('/:doctorId', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getDoctor', req.params.doctorId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) {
    if (err.message.includes('does not exist')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// PATCH /api/doctors/:doctorId/verify  (admin only)
router.patch('/:doctorId/verify',
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const r = await submitTransaction('verifyDoctor', req.params.doctorId, req.user.entityId, req.user.role);
      res.json({ message: 'Doctor verified successfully', result: r });
    } catch (err) { next(err); }
  }
);

module.exports = router;
