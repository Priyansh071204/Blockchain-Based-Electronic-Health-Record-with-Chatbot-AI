'use strict';

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { submitTransaction, evaluateTransaction } = require('../config/fabric');
const { uploadToIPFS } = require('../services/ipfsService');
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);

const ok = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ errors: e.array() });
  next();
};

// POST /api/records  (doctor creates a record, optionally with file)
router.post('/',
  requireRole('doctor'),
  upload.single('file'),
  body('patientId').trim().notEmpty(),
  body('recordType').isIn(['Lab Result', 'Imaging', 'Discharge Summary', 'Prescription', 'Consultation', 'Vaccination', 'Other']),
  body('description').trim().notEmpty(),
  ok,
  async (req, res, next) => {
    try {
      const { patientId, recordType, description, metadata } = req.body;
      const doctorId = req.user.entityId;
      const recordId = uuidv4();

      // Upload file or JSON metadata to IPFS
      let ipfsResult;
      if (req.file) {
        ipfsResult = await uploadToIPFS(req.file.buffer, req.file.originalname);
      } else {
        const { uploadJSON } = require('../services/ipfsService');
        ipfsResult = await uploadJSON({ patientId, doctorId, recordType, description, metadata: metadata || {} });
      }

      const metaObj = {
        filename: req.file?.originalname || 'record.json',
        mimetype: req.file?.mimetype || 'application/json',
        size: ipfsResult.size,
        ipfsUrl: ipfsResult.url,
        mock: ipfsResult.mock || false,
        ...(metadata ? JSON.parse(metadata) : {}),
      };

      const result = await submitTransaction(
        'createHealthRecord',
        recordId, patientId, doctorId,
        ipfsResult.hash, recordType, description,
        JSON.stringify(metaObj),
        req.user.entityId, req.user.role
      );

      res.status(201).json(result);
    } catch (err) {
      if (err.message.toLowerCase().includes('access denied')) return res.status(403).json({ error: err.message });
      next(err);
    }
  }
);

// GET /api/records/:recordId
router.get('/:recordId', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getHealthRecord', req.params.recordId, req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) {
    if (err.message.includes('does not exist')) return res.status(404).json({ error: err.message });
    if (err.message.toLowerCase().includes('access denied')) return res.status(403).json({ error: err.message });
    next(err);
  }
});

// GET /api/records/:recordId/history
router.get('/:recordId/history', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('getRecordHistory', req.params.recordId);
    res.json(r);
  } catch (err) { next(err); }
});

module.exports = router;
