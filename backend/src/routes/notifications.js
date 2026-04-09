'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

/**
 * GET /api/notifications/subscribe
 * Subscribes to the real-time SSE notification stream.
 */
router.get('/subscribe', authenticate, (req, res) => {
  notificationService.subscribe(req, res);
});

/**
 * POST /api/notifications/simulate
 * Broadcasts a test notification (Development only)
 */
router.post('/simulate', authenticate, (req, res) => {
  const { type, message, urgent } = req.body;
  notificationService.notify(req.user.entityId, {
    type: type || 'TRANSACTION',
    message: message || 'This is a test notification from the blockchain.',
    urgent: urgent ?? false
  });
  res.json({ success: true });
});

module.exports = router;
