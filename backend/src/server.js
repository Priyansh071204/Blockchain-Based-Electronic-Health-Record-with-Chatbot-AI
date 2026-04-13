'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Ensure dirs exist ─────────────────────────────────────────────────────────
['./uploads', './wallet', './logs'].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { error: 'Too many requests – try again later' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: m => logger.info(m.trim()) } }));

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve('./uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'EHR API', version: '1.0.0', ts: new Date().toISOString() })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/patients',      require('./routes/patients'));
app.use('/api/doctors',       require('./routes/doctors'));
app.use('/api/records',       require('./routes/records'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/fabric',        require('./routes/fabric'));
app.use('/api/notifications', require('./routes/notifications'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info(`🏥 EHR Backend  →  http://localhost:${PORT}`);
    logger.info(`🌿 Environment  →  ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📦 IPFS         →  ${process.env.IPFS_PROTOCOL}://${process.env.IPFS_HOST}:${process.env.IPFS_PORT}`);
    logger.info(`⛓  Fabric       →  ${process.env.FABRIC_CHANNEL_NAME} / ${process.env.FABRIC_CHAINCODE_NAME}`);
  });
}

module.exports = app;
