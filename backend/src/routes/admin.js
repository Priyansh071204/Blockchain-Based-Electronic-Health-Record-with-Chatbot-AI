'use strict';

const router = require('express').Router();
const { evaluateTransaction } = require('../config/fabric');
const { authenticate, requireRole } = require('../middleware/auth');
const authService = require('../services/authService');

router.use(authenticate, requireRole('admin'));

// GET /api/admin/patients
router.get('/patients', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('queryAllPatients', req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

// GET /api/admin/doctors
router.get('/doctors', async (req, res, next) => {
  try {
    const r = await evaluateTransaction('queryAllDoctors', req.user.entityId, req.user.role);
    res.json(r);
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  res.json(authService.getAll());
});

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [patients, doctors, users] = await Promise.all([
      evaluateTransaction('queryAllPatients', req.user.entityId, req.user.role),
      evaluateTransaction('queryAllDoctors', req.user.entityId, req.user.role),
      Promise.resolve(authService.getAll()),
    ]);
    res.json({
      totalPatients: Array.isArray(patients) ? patients.length : 0,
      totalDoctors: Array.isArray(doctors) ? doctors.length : 0,
      totalUsers: users.length,
      verifiedDoctors: Array.isArray(doctors) ? doctors.filter(d => d.verified).length : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

module.exports = router;
