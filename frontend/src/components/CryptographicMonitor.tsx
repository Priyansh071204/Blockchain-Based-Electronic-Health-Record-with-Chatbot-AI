import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Activity, 
  Layers, 
  RefreshCw, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';

interface Block {
  number: number;
  hash: string;
  prevHash: string;
  txCount: number;
  timestamp: string;
  merkleRoot: string;
}

const CryptographicMonitor: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [entropyMultiplier, setEntropyMultiplier] = useState(1);
  const [entropySpeed, setEntropySpeed] = useState(1);
  const [cipherKey, setCipherKey] = useState('0xAE88F3...61DE4');
  const [peerPings, setPeerPings] = useState({
    peer0: 12,
    peer1: 15,
    orderer: 8,
    ca: 24
  });

  const waveCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize block ledger
  useEffect(() => {
    const generateInitialBlocks = () => {
      const initial: Block[] = [];
      let prev = '0000000000000000000000000000000000000000000000000000000000000000';
      for (let i = 0; i < 4; i++) {
        const hash = Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        const root = Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        initial.unshift({
          number: 1024 + i,
          hash: '0x' + hash.slice(0, 16) + '...' + hash.slice(-8),
          prevHash: '0x' + prev.slice(0, 8) + '...' + prev.slice(-4),
          txCount: Math.floor(Math.random() * 15) + 1,
          timestamp: new Date(Date.now() - (3 - i) * 6000).toLocaleTimeString(),
          merkleRoot: '0x' + root.slice(0, 16) + '...'
        });
        prev = hash;
      }
      setBlocks(initial);
      setSelectedBlock(initial[0]);
    };

    generateInitialBlocks();
  }, []);

  // Interval to add new ledger blocks automatically
  useEffect(() => {
    const interval = setInterval(() => {
      addNewBlock();
    }, 5000);

    return () => clearInterval(interval);
  }, [blocks]);

  // Interval to fluctuate peer pings slightly for realism
  useEffect(() => {
    const pingInterval = setInterval(() => {
      setPeerPings({
        peer0: Math.max(5, 12 + Math.floor((Math.random() - 0.5) * 6)),
        peer1: Math.max(5, 15 + Math.floor((Math.random() - 0.5) * 8)),
        orderer: Math.max(3, 8 + Math.floor((Math.random() - 0.5) * 4)),
        ca: Math.max(10, 24 + Math.floor((Math.random() - 0.5) * 10))
      });
    }, 3000);

    return () => clearInterval(pingInterval);
  }, []);

  // Canvas wave animation
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;
    
    // Resize handler
    const fitCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 70;
      }
    };
    fitCanvas();
    window.addEventListener('resize', fitCanvas);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw gridlines behind wave
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 10; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 10; j < canvas.height; j += 15) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.6)';
      ctx.lineWidth = 1.5;
      
      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;
      
      // Draw primary glowing wave
      for (let x = 0; x < width; x++) {
        const angle = (x / 40) * entropySpeed + offset;
        const amplitude = Math.sin(angle) * 18 * entropyMultiplier;
        const noise = (Math.random() - 0.5) * 1.5; // slight digital distortion
        const y = midY + amplitude + noise;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw shadow glow under primary wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)';
      ctx.lineWidth = 4;
      for (let x = 0; x < width; x++) {
        const angle = (x / 40) * entropySpeed + offset;
        const y = midY + Math.sin(angle) * 18 * entropyMultiplier;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw secondary out-of-phase wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x++) {
        const angle = (x / 30) * (entropySpeed * 0.8) - offset * 1.2;
        const y = midY + Math.cos(angle) * 10 * (entropyMultiplier * 0.8);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset += 0.05 * entropySpeed;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', fitCanvas);
    };
  }, [entropyMultiplier, entropySpeed]);

  const addNewBlock = () => {
    setBlocks((prev) => {
      const nextNum = prev.length > 0 ? prev[0].number + 1 : 1000;
      const prevHash = prev.length > 0 ? prev[0].hash : '0x00000...0000';
      const hash = Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      const root = Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const newBlock: Block = {
        number: nextNum,
        hash: '0x' + hash.slice(0, 16) + '...' + hash.slice(-8),
        prevHash: prevHash,
        txCount: Math.floor(Math.random() * 20) + 1,
        timestamp: new Date().toLocaleTimeString(),
        merkleRoot: '0x' + root.slice(0, 16) + '...'
      };

      const updated = [newBlock, ...prev];
      if (updated.length > 5) updated.pop(); // keep maximum 5 in queue

      // Automatically update selected preview
      setSelectedBlock(newBlock);
      return updated;
    });
  };

  const injectEntropy = () => {
    setEntropyMultiplier(2.4);
    setEntropySpeed(2.2);
    setTimeout(() => {
      setEntropyMultiplier(1.0);
      setEntropySpeed(1.0);
    }, 1500);
  };

  const rotateCipherKeys = () => {
    let steps = 0;
    const interval = setInterval(() => {
      const randomHex = Array.from({ length: 16 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setCipherKey('0x' + randomHex.toUpperCase() + '...');
      steps++;
      if (steps > 10) {
        clearInterval(interval);
        // Set actual static hash
        const finalHex = Array.from({ length: 12 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        setCipherKey('0x' + finalHex.toUpperCase() + 'D54F');
      }
    }, 80);
  };

  return (
    <div className="crypto-monitor-card lume-panel overflow-hidden">
      {/* HUD Frame Elements */}
      <div className="hud-corner-bracket top-left"></div>
      <div className="hud-corner-bracket top-right"></div>
      <div className="hud-corner-bracket bottom-left"></div>
      <div className="hud-corner-bracket bottom-right"></div>

      <header className="monitor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity className="monitor-title-icon text-cyan animate-pulse" size={16} />
          <span className="monitor-title">MSP PROTOCOL MONITOR</span>
        </div>
        <div className="telemetry-stamp">CHANNEL_ID: SECURE.LEDGER.V1</div>
      </header>

      <div className="monitor-layout">
        {/* Entropy Graph */}
        <section className="monitor-section">
          <div className="section-header">
            <span className="section-label">DECRYPTION KEY ENTROPY</span>
            <span className="badge-lume text-cyan">AES_GCM_RATE: STABLE</span>
          </div>
          <div className="wave-container" style={{ position: 'relative' }}>
            <canvas ref={waveCanvasRef} />
            <div className="entropy-telemetry font-mono">
              <span>FREQ: {(entropySpeed * 4.2).toFixed(2)} GHz</span>
              <span>AMPL: {(entropyMultiplier * 8.5).toFixed(2)} V</span>
            </div>
          </div>
          <div className="control-bar">
            <button className="monitor-control-btn font-mono" onClick={injectEntropy}>
              <Zap size={10} /> INJECT_ENTROPY
            </button>
            <button className="monitor-control-btn font-mono" onClick={rotateCipherKeys}>
              <RefreshCw size={10} /> ROTATE_KEYS
            </button>
          </div>
        </section>

        {/* Live Blockchain Ledger */}
        <section className="monitor-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers className="text-violet" size={12} />
              <span className="section-label">CHANNEL LEDGER SYNCS</span>
            </div>
            <button className="generate-block-btn font-mono" onClick={addNewBlock}>
              + MINT_BLOCK
            </button>
          </div>

          <div className="ledger-block-container">
            <div className="ledger-queue">
              <AnimatePresence>
                {blocks.map((block) => (
                  <motion.div 
                    key={block.number}
                    className={`ledger-block ${selectedBlock?.number === block.number ? 'active' : ''}`}
                    onClick={() => setSelectedBlock(block)}
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <div className="block-head">
                      <Database size={10} />
                      <span className="block-num">BLOCK #{block.number}</span>
                      <span className="block-tx">{block.txCount} TXs</span>
                    </div>
                    <div className="block-body font-mono">
                      <span>HASH: {block.hash}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Block Details Preview */}
            {selectedBlock && (
              <div className="block-details font-mono">
                <div className="detail-row">
                  <span className="detail-lbl">MERKLE_ROOT:</span>
                  <span className="detail-val text-cyan">{selectedBlock.merkleRoot}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-lbl">PREV_HASH:</span>
                  <span className="detail-val">{selectedBlock.prevHash}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-lbl">TIMESTAMP:</span>
                  <span className="detail-val">{selectedBlock.timestamp}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-lbl">STATE_PROOF:</span>
                  <span className="detail-val text-violet">ECDSA_SHA256</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Telemetry Peer status grid */}
        <section className="monitor-section">
          <div className="section-header">
            <span className="section-label">ACTIVE NETWORK ENDPOINTS</span>
            <span style={{ fontSize: '7px', fontFamily: 'var(--font-mono)' }} className="text-cyan">
              TLS_SESSION: 1.3
            </span>
          </div>

          <div className="peers-grid">
            <div className="peer-card font-mono">
              <div className="peer-card-header">
                <div className="peer-status-dot active"></div>
                <span className="peer-name">peer0.org1</span>
              </div>
              <div className="peer-detail-info">
                <span>PING: {peerPings.peer0}ms</span>
                <span>STATE: ACTIVE</span>
              </div>
            </div>

            <div className="peer-card font-mono">
              <div className="peer-card-header">
                <div className="peer-status-dot active"></div>
                <span className="peer-name">peer0.org2</span>
              </div>
              <div className="peer-detail-info">
                <span>PING: {peerPings.peer1}ms</span>
                <span>STATE: ACTIVE</span>
              </div>
            </div>

            <div className="peer-card font-mono">
              <div className="peer-card-header">
                <div className="peer-status-dot active"></div>
                <span className="peer-name">orderer.ehr</span>
              </div>
              <div className="peer-detail-info">
                <span>PING: {peerPings.orderer}ms</span>
                <span>STATE: RUNNING</span>
              </div>
            </div>

            <div className="peer-card font-mono">
              <div className="peer-card-header">
                <div className="peer-status-dot active"></div>
                <span className="peer-name">ca.identity</span>
              </div>
              <div className="peer-detail-info">
                <span>PING: {peerPings.ca}ms</span>
                <span>STATE: IDLE</span>
              </div>
            </div>
          </div>
        </section>

        {/* Decrypted Cipher Keys */}
        <div className="cipher-info-box font-mono">
          <div className="info-box-header">
            <ShieldCheck size={12} className="text-cyan" />
            <span>SESSION KEY SPECIFICATION</span>
          </div>
          <div className="info-box-contents">
            <div className="key-bytes-val text-cyan">{cipherKey}</div>
            <div className="key-bytes-algo">AES_256_GCM | SHA_256</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptographicMonitor;
