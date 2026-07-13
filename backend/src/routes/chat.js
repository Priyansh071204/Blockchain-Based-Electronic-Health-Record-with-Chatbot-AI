'use strict';

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const chatService = require('../services/reportChatService');

router.use(authenticate);
router.use(requireRole('patient', 'doctor', 'admin'));

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get('/report', (req, res) => {
  res.json({ report: chatService.getReport(req.user) });
});

router.post('/report', upload.single('report'), async (req, res, next) => {
  try {
    const report = await chatService.saveReport(req.user, req.file);
    res.status(201).json({ report });
  } catch (err) {
    next(err);
  }
});

router.post('/ask', body('question').trim().isLength({ min: 2 }), validate, async (req, res, next) => {
  try {
    res.json(await chatService.askReport(req.user, req.body.question));
  } catch (err) {
    next(err);
  }
});

router.delete('/report', (req, res) => {
  chatService.clearReport(req.user);
  res.json({ success: true });
});

module.exports = router;
