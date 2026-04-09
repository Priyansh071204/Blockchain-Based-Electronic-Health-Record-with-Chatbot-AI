'use strict';

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// POST /api/auth/register
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
  body('role').isIn(['patient', 'doctor', 'pharmacist']),
  body('name').trim().notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ message: 'Registered successfully', user });
    } catch (err) { next(err); }
  }
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) { next(err); }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
    res.json(await authService.refresh(refreshToken));
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res, next) => {
  try { res.json(authService.getById(req.user.id)); }
  catch (err) { next(err); }
});

// POST /api/auth/logout  (client just discards token; server logs it)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out' });
});

module.exports = router;
