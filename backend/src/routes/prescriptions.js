'use strict';

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { randomUUID } = require('crypto');
const { submitTransaction, evaluateTransaction } = require('../config/fabric');
const { authenticate, requireRole } = require('../middleware/auth');
const logger = require('../config/logger');

router.use(authenticate);

const ok = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ errors: e.array() });
  next();
};

// POST /api/prescriptions  (doctor only)
router.post('/',
  requireRole('doctor'),
  body('patientId').trim().notEmpty(),
  body('medications').isArray({ min: 1 }).withMessage('At least one medication required'),
  body('medications.*.name').notEmpty(),
  body('medications.*.dosage').notEmpty(),
  body('medications.*.frequency').notEmpty(),
  body('instructions').trim().notEmpty(),
  ok,
  async (req, res, next) => {
    try {
      const { patientId, medications, instructions, validUntil } = req.body;
      const prescriptionId = randomUUID();
      const doctorId = req.user.entityId;

      const r = await submitTransaction(
        'createPrescription',
        prescriptionId, patientId, doctorId,
        JSON.stringify(medications), instructions,
        validUntil || '',
        req.user.entityId, req.user.role
      );
      res.status(201).json(r);
    } catch (err) {
      if (err.message.toLowerCase().includes('access denied')) return res.status(403).json({ error: err.message });
      next(err);
    }
  }
);

// GET /api/prescriptions/:prescriptionId
router.get('/:prescriptionId', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getPrescription', req.params.prescriptionId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) {
    if (err.message.includes('does not exist')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// PATCH /api/prescriptions/:prescriptionId/dispense  (pharmacist or admin)
router.patch('/:prescriptionId/dispense',
  requireRole('pharmacist', 'admin'),
  async (req, res, next) => {
    try {
      const pharmacistId = req.user.entityId;
      const r = await submitTransaction(
        'dispensePrescription',
        req.params.prescriptionId, pharmacistId,
        req.user.entityId, req.user.role
      );
      res.json(r);
    } catch (err) {
      if (err.message.includes('already') || err.message.includes('expired'))
        return res.status(400).json({ error: err.message });
      next(err);
    }
  }
);

module.exports = router;
