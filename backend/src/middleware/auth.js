'use strict';

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  const queryToken = req.query.token;
  
  if (!header?.startsWith('Bearer ') && !queryToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = queryToken || header.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ error: msg });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    logger.warn(`Access denied: ${req.user.email} [${req.user.role}] → ${req.method} ${req.path}`);
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const requireSelfOrAdmin = (param = 'id') => (req, res, next) => {
  const { role, entityId } = req.user;
  if (role === 'admin' || entityId === req.params[param]) return next();
  res.status(403).json({ error: 'Access denied' });
};

module.exports = { authenticate, requireRole, requireSelfOrAdmin };
