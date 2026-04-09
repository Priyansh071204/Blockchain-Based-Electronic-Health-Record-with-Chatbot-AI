'use strict';

const router = require('express').Router();
const { getFabricStatus } = require('../config/fabric');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/fabric/status
router.get('/status', async (req, res, next) => {
  try {
    const status = await getFabricStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
