'use strict';

const EventEmitter = require('events');
const logger = require('../config/logger');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // entityId -> Set of res objects
  }

  /**
   * Handle SSE subscription
   */
  subscribe(req, res) {
    const entityId = req.user.entityId;
    
    // Headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send initial keep-alive
    res.write('retry: 10000\n\n');
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Notification stream active' })}\n\n`);

    if (!this.clients.has(entityId)) {
      this.clients.set(entityId, new Set());
    }
    
    const clientSet = this.clients.get(entityId);
    clientSet.add(res);

    logger.info(`[SSE] Client connected: ${entityId} (Total: ${clientSet.size})`);

    // Heartbeat every 30s to prevent timeouts
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clientSet.delete(res);
      if (clientSet.size === 0) {
        this.clients.delete(entityId);
      }
      logger.info(`[SSE] Client disconnected: ${entityId}`);
    });
  }

  /**
   * Broadcast/Notify a specific user
   */
  notify(entityId, notification) {
    const clientSet = this.clients.get(entityId);
    if (!clientSet || clientSet.size === 0) {
      logger.debug(`[SSE] No active clients for user ${entityId}, notification queued/skipped`);
      return;
    }

    const payload = `data: ${JSON.stringify({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    })}\n\n`;

    clientSet.forEach(res => res.write(payload));
    logger.info(`[SSE] Notification pushed to ${entityId}: ${notification.type}`);
  }
}

module.exports = new NotificationService();
