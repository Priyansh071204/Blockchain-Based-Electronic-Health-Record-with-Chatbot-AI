'use strict';

const logger = require('../config/logger');
const crypto = require('crypto');

let _client = null;
let _mocked = false;

async function getClient() {
  if (_client) return _client;

  try {
    // ipfs-http-client v56 uses CJS export
    const { create } = require('ipfs-http-client');
    _client = create({
      host: process.env.IPFS_HOST || 'localhost',
      port: parseInt(process.env.IPFS_PORT || '5001'),
      protocol: process.env.IPFS_PROTOCOL || 'http',
    });

    // Test connection
    await _client.version();
    logger.info('IPFS client connected successfully');
    return _client;
  } catch (err) {
    logger.error(`❌ IPFS connection failed: ${err.message}`);
    _client = null;
    throw err; // Strict Real Mode: fail if IPFS is down
  }
}

/**
 * Upload a Buffer to IPFS. Returns { hash, url, size }.
 */
async function uploadToIPFS(buffer, filename = 'file') {
  const client = await getClient();

  if (!client) {
    const hash = 'Qm' + crypto.createHash('sha256')
      .update(buffer).digest('hex').slice(0, 44);
    logger.warn(`[MOCK IPFS] hash=${hash} file=${filename}`);
    return {
      hash,
      url: `${process.env.IPFS_GATEWAY || 'http://localhost:8080/ipfs'}/${hash}`,
      size: buffer.length,
      mock: true,
    };
  }

  const result = await client.add(buffer, { pin: true, wrapWithDirectory: false });
  const hash = result.cid.toString();
  logger.info(`Uploaded to IPFS: ${hash} (${result.size} bytes)`);
  return {
    hash,
    url: `${process.env.IPFS_GATEWAY || 'http://localhost:8080/ipfs'}/${hash}`,
    size: result.size,
    mock: false,
  };
}

/**
 * Upload a JSON object to IPFS.
 */
async function uploadJSON(data) {
  return uploadToIPFS(Buffer.from(JSON.stringify(data)), 'record.json');
}

/**
 * Retrieve content from IPFS by hash.
 */
async function getFromIPFS(hash) {
  const client = await getClient();
  if (!client) return null;

  const chunks = [];
  for await (const chunk of client.cat(hash)) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = { uploadToIPFS, uploadJSON, getFromIPFS };
