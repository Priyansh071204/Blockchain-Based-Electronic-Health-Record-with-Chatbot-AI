import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface BlockchainNode {
  pos: Point3D;
  targetPos: Point3D;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface FloatingCard {
  pos: Point3D;
  width: number;
  height: number;
  title: string;
  lines: string[];
  type: 'ecg' | 'telemetry' | 'ledger';
  ecgPoints: number[];
  ecgIndex: number;
}

const Medical3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse parallax variables
    let mouseX = 0;
    let mouseY = 0;
    let targetCamRotX = 0;
    let targetCamRotY = 0;
    let camRotX = 0;
    let camRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      targetCamRotY = ((mouseX - window.innerWidth / 2) / window.innerWidth) * 0.4;
      targetCamRotX = -((mouseY - window.innerHeight / 2) / window.innerHeight) * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Engine Constants
    const fov = 500;
    const cameraZ = 600;

    // Projection helper
    const project = (p: Point3D): { x: number; y: number; scale: number; visible: boolean } => {
      // Apply camera rotations
      // Rotation Y
      const cosY = Math.cos(camRotY);
      const sinY = Math.sin(camRotY);
      let rx1 = p.x * cosY + p.z * sinY;
      let rz1 = -p.x * sinY + p.z * cosY;

      // Rotation X
      const cosX = Math.cos(camRotX);
      const sinX = Math.sin(camRotX);
      let ry2 = p.y * cosX - rz1 * sinX;
      let rz2 = p.y * sinX + rz1 * cosX;

      const zDepth = rz2 + cameraZ;
      if (zDepth <= 10) return { x: 0, y: 0, scale: 0, visible: false };

      const scale = fov / zDepth;
      // Center coordinates offset
      const cx = width * 0.31; // Keep the main 3D field on the visual side of the login screen
      const cy = height * 0.5;

      const x2d = cx + rx1 * scale;
      const y2d = cy + ry2 * scale;

      return { x: x2d, y: y2d, scale, visible: true };
    };

    // Rotation around custom axes helper
    const rotateX = (p: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
    };

    const rotateY = (p: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
    };

    const rotateZ = (p: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos, z: p.z };
    };

    // 1. Initialize DNA Helix Parameters
    const dnaPoints = 38;
    const dnaRadius = 56;
    const dnaSpacing = 14;
    const dnaAngleStep = 0.35;

    // 2. Initialize Medical Cube Parameters
    const cubeSize = 52;
    const cubeVertices: Point3D[] = [
      { x: -cubeSize, y: -cubeSize, z: -cubeSize },
      { x: cubeSize, y: -cubeSize, z: -cubeSize },
      { x: cubeSize, y: cubeSize, z: -cubeSize },
      { x: -cubeSize, y: cubeSize, z: -cubeSize },
      { x: -cubeSize, y: -cubeSize, z: cubeSize },
      { x: cubeSize, y: -cubeSize, z: cubeSize },
      { x: cubeSize, y: cubeSize, z: cubeSize },
      { x: -cubeSize, y: cubeSize, z: cubeSize },
    ];
    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Back
      [4, 5], [5, 6], [6, 7], [7, 4], // Front
      [0, 4], [1, 5], [2, 6], [3, 7], // Links
    ];
    // Glowing medical cross lines inside cube
    const crossLines: { p1: Point3D; p2: Point3D }[] = [
      { p1: { x: -18, y: 0, z: 0 }, p2: { x: 18, y: 0, z: 0 } },
      { p1: { x: 0, y: -18, z: 0 }, p2: { x: 0, y: 18, z: 0 } },
      // Medical cross width
      { p1: { x: -18, y: -6, z: 0 }, p2: { x: -18, y: 6, z: 0 } },
      { p1: { x: 18, y: -6, z: 0 }, p2: { x: 18, y: 6, z: 0 } },
      { p1: { x: -6, y: -18, z: 0 }, p2: { x: 6, y: -18, z: 0 } },
      { p1: { x: -6, y: 18, z: 0 }, p2: { x: 6, y: 18, z: 0 } },
    ];

    // 3. Initialize Blockchain Nodes
    const blockchainNodes: BlockchainNode[] = [];
    const nodeCount = 58;
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 210 + Math.random() * 190;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      blockchainNodes.push({
        pos: { x, y, z },
        targetPos: { x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 40, z: z + (Math.random() - 0.5) * 40 },
        radius: Math.random() * 1.5 + 1.5,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.03 + Math.random() * 0.04,
      });
    }

    // 4. Initialize Floating Data Cards
    // ECG Waveform definition (P-Q-R-S-T sequence)
    const rawEcg = [0, 0, 0, 0.05, 0, -0.05, 0.6, -0.2, 0, 0.15, 0, 0, 0, 0];
    const ecgBufferLength = 45;
    const generateEcgBuffer = () => {
      const buffer = [];
      for (let i = 0; i < ecgBufferLength; i++) {
        buffer.push(0);
      }
      return buffer;
    };

    const floatingCards: FloatingCard[] = [
      {
        pos: { x: -250, y: -160, z: 80 },
        width: 205,
        height: 118,
        title: 'PATIENT VITAL telemetry',
        lines: ['ID: #MC-0988', 'HR: 72 BPM // NORMAL', 'TEMP: 98.6°F', 'BP: 120/80 mmHg'],
        type: 'ecg',
        ecgPoints: generateEcgBuffer(),
        ecgIndex: 0,
      },
      {
        pos: { x: -280, y: 150, z: -50 },
        width: 210,
        height: 108,
        title: 'BLOCKCHAIN NODE AUTH',
        lines: ['NODE: #EU-W4', 'SYNC_STATUS: ACTIVE', 'PEERS: 24 CONNECTED', 'SECURITY: AES-GCM'],
        type: 'telemetry',
        ecgPoints: [],
        ecgIndex: 0,
      },
      {
        pos: { x: 50, y: 190, z: 120 },
        width: 225,
        height: 118,
        title: 'BLOCK VERIFICATION LEDGER',
        lines: ['INDEX: #490,291', 'HASH: 0x7A9B...FE43', 'PROVEN: SECP256R1', 'IPFS STORAGE: SECURE'],
        type: 'ledger',
        ecgPoints: [],
        ecgIndex: 0,
      },
    ];

    let time = 0;

    const animate = () => {
      time += 0.01;

      // Smooth camera interpolation
      camRotY += (targetCamRotY - camRotY) * 0.05;
      camRotX += (targetCamRotX - camRotX) * 0.05;

      // Dark background gradient matching deep navy and teal accents
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient lights
      const gradient = ctx.createRadialGradient(
        width * 0.26,
        height * 0.48,
        10,
        width * 0.34,
        height * 0.5,
        width * 0.55
      );
      gradient.addColorStop(0, 'rgba(0, 242, 255, 0.13)');
      gradient.addColorStop(0.42, 'rgba(13, 148, 136, 0.06)');
      gradient.addColorStop(0.68, 'rgba(2, 6, 23, 0)');
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid overlay in 3D
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.035)';
      ctx.lineWidth = 1;
      const gridSpacing = 80;
      for (let x = -500; x <= 500; x += gridSpacing) {
        ctx.beginPath();
        for (let y = -400; y <= 400; y += 40) {
          const pt = project({ x, y, z: -200 });
          if (pt.visible) {
            if (y === -400) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();
      }

      // 1. UPDATE AND DRAW BLOCKCHAIN CLOUD NODES
      blockchainNodes.forEach((node, idx) => {
        node.pulsePhase += node.pulseSpeed;
        const driftX = Math.sin(time + idx) * 0.15;
        const driftY = Math.cos(time * 0.8 + idx) * 0.15;
        const driftZ = Math.sin(time * 0.5 + idx) * 0.15;

        node.pos.x += driftX;
        node.pos.y += driftY;
        node.pos.z += driftZ;

        // Apply a slow planetary rotation to nodes over time
        let rotatedPos = rotateY(node.pos, time * 0.05);
        rotatedPos = rotateX(rotatedPos, time * 0.02);

        const proj = project(rotatedPos);
        if (proj.visible) {
          const glow = Math.abs(Math.sin(node.pulsePhase)) * 4 + 1;
          const nodeAlpha = (0.2 + (rotatedPos.z + 300) / 600) * 0.4; // depth alpha mapping

          ctx.beginPath();
          ctx.arc(proj.x, proj.y, node.radius * proj.scale * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 242, 255, ${nodeAlpha})`;
          ctx.fill();

          // Node border glow
          if (glow > 2.5) {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, (node.radius + glow * 0.5) * proj.scale * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 242, 255, ${nodeAlpha * 0.25})`;
            ctx.fill();
          }

          // Connect nearby nodes
          for (let j = idx + 1; j < blockchainNodes.length; j++) {
            const node2 = blockchainNodes[j];
            let rPos2 = rotateY(node2.pos, time * 0.05);
            rPos2 = rotateX(rPos2, time * 0.02);

            const dx = rotatedPos.x - rPos2.x;
            const dy = rotatedPos.y - rPos2.y;
            const dz = rotatedPos.z - rPos2.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 110) {
              const proj2 = project(rPos2);
              if (proj2.visible) {
                const connAlpha = (1 - dist / 110) * 0.07 * nodeAlpha;
                ctx.beginPath();
                ctx.moveTo(proj.x, proj.y);
                ctx.lineTo(proj2.x, proj2.y);
                ctx.strokeStyle = `rgba(13, 148, 136, ${connAlpha})`;
                ctx.lineWidth = 0.5 * proj.scale;
                ctx.stroke();
              }
            }
          }
        }
      });

      // 2. RENDER THE DNA HELIX
      const dnaOffset = { x: -80, y: -20, z: -40 };
      const helixPoints: { a: Point3D; b: Point3D; alpha: number }[] = [];

      for (let i = 0; i < dnaPoints; i++) {
        const hY = (i - dnaPoints / 2) * dnaSpacing;
        const helixAngle = i * dnaAngleStep + time * 0.9;

        // Rotate spirals
        const ptA = {
          x: dnaOffset.x + dnaRadius * Math.cos(helixAngle),
          y: dnaOffset.y + hY,
          z: dnaOffset.z + dnaRadius * Math.sin(helixAngle),
        };

        const ptB = {
          x: dnaOffset.x + dnaRadius * Math.cos(helixAngle + Math.PI),
          y: dnaOffset.y + hY,
          z: dnaOffset.z + dnaRadius * Math.sin(helixAngle + Math.PI),
        };

        // Extra helix rotation for high tech feel
        let rotA = rotateY(ptA, time * 0.08);
        rotA = rotateX(rotA, time * 0.05);
        let rotB = rotateY(ptB, time * 0.08);
        rotB = rotateX(rotB, time * 0.05);

        const depthAlpha = (rotA.z + 300) / 600;
        const alpha = Math.max(0.1, Math.min(1, depthAlpha)) * 0.85;

        helixPoints.push({ a: rotA, b: rotB, alpha });
      }

      // Draw Rungs (Base pairs connecting the spirals)
      helixPoints.forEach((pair, idx) => {
        const projA = project(pair.a);
        const projB = project(pair.b);

        if (projA.visible && projB.visible) {
          // Determine color based on index to represent base pair variations
          let baseColor = 'rgba(20, 184, 166, '; // default teal
          if (idx % 4 === 0) baseColor = 'rgba(0, 242, 255, '; // cyan
          else if (idx % 4 === 2) baseColor = 'rgba(255, 255, 255, '; // white/teal

          ctx.beginPath();
          ctx.moveTo(projA.x, projA.y);
          ctx.lineTo(projB.x, projB.y);
          ctx.strokeStyle = `${baseColor}${pair.alpha * 0.25})`;
          ctx.lineWidth = 1 * projA.scale;
          ctx.stroke();

          // Central connection point indicator
          const midX = (projA.x + projB.x) / 2;
          const midY = (projA.y + projB.y) / 2;
          ctx.beginPath();
          ctx.arc(midX, midY, 1.5 * projA.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${pair.alpha * 0.45})`;
          ctx.fill();
        }
      });

      // Draw Helix Nodes (Beads on the outer strands)
      helixPoints.forEach((pair) => {
        const projA = project(pair.a);
        const projB = project(pair.b);

        if (projA.visible) {
          ctx.beginPath();
          ctx.arc(projA.x, projA.y, 3.5 * projA.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 242, 255, ${pair.alpha})`;
          ctx.fill();
          // Glow
          ctx.beginPath();
          ctx.arc(projA.x, projA.y, 6.5 * projA.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 242, 255, ${pair.alpha * 0.2})`;
          ctx.fill();
        }

        if (projB.visible) {
          ctx.beginPath();
          ctx.arc(projB.x, projB.y, 3 * projB.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${pair.alpha * 0.9})`;
          ctx.fill();
          // Glow
          ctx.beginPath();
          ctx.arc(projB.x, projB.y, 5 * projB.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(20, 184, 166, ${pair.alpha * 0.35})`;
          ctx.fill();
        }
      });

      // 3. RENDER THE ROTATING MEDICAL CUBE
      const cubeOffset = { x: 140, y: -130, z: -100 };
      const cubeAngleX = time * 0.3;
      const cubeAngleY = time * 0.4;
      const cubeAngleZ = time * 0.15;

      const projectedVertices: { x: number; y: number; scale: number; visible: boolean; z: number }[] = [];

      cubeVertices.forEach((v) => {
        // Rotate local cube
        let rV = rotateX(v, cubeAngleX);
        rV = rotateY(rV, cubeAngleY);
        rV = rotateZ(rV, cubeAngleZ);

        // Add offset
        const worldPos = {
          x: rV.x + cubeOffset.x,
          y: rV.y + cubeOffset.y,
          z: rV.z + cubeOffset.z,
        };

        // Scene camera rotation
        let scenePos = rotateY(worldPos, time * 0.02);
        scenePos = rotateX(scenePos, time * 0.01);

        const proj = project(scenePos);
        projectedVertices.push({ ...proj, z: scenePos.z });
      });

      // Draw cube lines with depth gradient
      ctx.lineWidth = 0.75;
      cubeEdges.forEach((edge) => {
        const v1 = projectedVertices[edge[0]];
        const v2 = projectedVertices[edge[1]];

        if (v1.visible && v2.visible) {
          const avgZ = (v1.z + v2.z) / 2;
          const alpha = Math.max(0.1, Math.min(0.8, (avgZ + 300) / 600)) * 0.45;

          ctx.beginPath();
          ctx.moveTo(v1.x, v1.y);
          ctx.lineTo(v2.x, v2.y);
          ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
          ctx.stroke();
        }
      });

      // Draw medical cross inside the cube
      ctx.lineWidth = 1.5;
      crossLines.forEach((line) => {
        let rP1 = rotateX(line.p1, cubeAngleX);
        rP1 = rotateY(rP1, cubeAngleY);
        rP1 = rotateZ(rP1, cubeAngleZ);
        rP1.x += cubeOffset.x;
        rP1.y += cubeOffset.y;
        rP1.z += cubeOffset.z;

        let rP2 = rotateX(line.p2, cubeAngleX);
        rP2 = rotateY(rP2, cubeAngleY);
        rP2 = rotateZ(rP2, cubeAngleZ);
        rP2.x += cubeOffset.x;
        rP2.y += cubeOffset.y;
        rP2.z += cubeOffset.z;

        let sceneP1 = rotateY(rP1, time * 0.02);
        sceneP1 = rotateX(sceneP1, time * 0.01);
        let sceneP2 = rotateY(rP2, time * 0.02);
        sceneP2 = rotateX(sceneP2, time * 0.01);

        const proj1 = project(sceneP1);
        const proj2 = project(sceneP2);

        if (proj1.visible && proj2.visible) {
          const avgZ = (sceneP1.z + sceneP2.z) / 2;
          const alpha = Math.max(0.1, Math.min(1, (avgZ + 300) / 600)) * 0.75;
          ctx.beginPath();
          ctx.moveTo(proj1.x, proj1.y);
          ctx.lineTo(proj2.x, proj2.y);
          ctx.strokeStyle = `rgba(13, 148, 136, ${alpha})`;
          ctx.stroke();
        }
      });

      // 4. RENDER DYNAMIC FLOATING MEDICAL CARDS
      floatingCards.forEach((card, idx) => {
        // Slow float drift calculation
        const drift = Math.sin(time * 0.6 + idx * 2.5) * 12;
        const activePos = {
          x: card.pos.x,
          y: card.pos.y + drift,
          z: card.pos.z + Math.cos(time * 0.4 + idx) * 15,
        };

        // Global scene camera rotation
        let scenePos = rotateY(activePos, time * 0.01);
        scenePos = rotateX(scenePos, time * 0.005);

        const projCenter = project(scenePos);
        if (!projCenter.visible) return;

        const scale = projCenter.scale;

        // Card corner coordinates for rendering skewed outline
        const tl = { x: -card.width / 2, y: -card.height / 2, z: 0 };
        const tr = { x: card.width / 2, y: -card.height / 2, z: 0 };
        const br = { x: card.width / 2, y: card.height / 2, z: 0 };
        const bl = { x: -card.width / 2, y: card.height / 2, z: 0 };

        // Rotate corners to simulate card's flat screen look facing the scene
        const rotateCorner = (pt: Point3D): Point3D => {
          // Individual card wobble
          let r = rotateY(pt, Math.sin(time * 0.5 + idx) * 0.1);
          r = rotateX(r, Math.cos(time * 0.4 + idx) * 0.08);

          // Translate to world position
          return {
            x: r.x + activePos.x,
            y: r.y + activePos.y,
            z: r.z + activePos.z,
          };
        };

        const corners = [
          project(rotateCorner(tl)),
          project(rotateCorner(tr)),
          project(rotateCorner(br)),
          project(rotateCorner(bl)),
        ];

        // Draw translucent background panel
        const depthAlpha = Math.max(0.1, Math.min(1, (scenePos.z + 300) / 600));
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        corners.slice(1).forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.closePath();
        ctx.fillStyle = `rgba(15, 23, 42, ${depthAlpha * 0.5})`;
        ctx.fill();

        // Glowing cyan border lines
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        corners.slice(1).forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.closePath();
        ctx.strokeStyle = `rgba(20, 184, 166, ${depthAlpha * 0.3})`;
        ctx.lineWidth = 1 * scale;
        ctx.stroke();

        // Technical corners for holographic card aesthetic
        ctx.strokeStyle = `rgba(0, 242, 255, ${depthAlpha * 0.65})`;
        ctx.lineWidth = 1.5 * scale;
        const cornerLen = 8 * scale;

        // Top Left
        ctx.beginPath();
        ctx.moveTo(corners[0].x + cornerLen, corners[0].y);
        ctx.lineTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[0].x, corners[0].y + cornerLen);
        ctx.stroke();

        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(corners[2].x - cornerLen, corners[2].y);
        ctx.lineTo(corners[2].x, corners[2].y);
        ctx.lineTo(corners[2].x, corners[2].y - cornerLen);
        ctx.stroke();

        // Text & Graphic content drawing inside the card
        const cardX = corners[0].x + 10 * scale;
        let cardY = corners[0].y + 14 * scale;

        // Card Title
        ctx.font = `bold ${Math.round(7.5 * scale)}px "Outfit", sans-serif`;
        ctx.fillStyle = `rgba(0, 242, 255, ${depthAlpha * 0.95})`;
        ctx.fillText(card.title.toUpperCase(), cardX, cardY);

        // Subtitle divider line
        ctx.beginPath();
        ctx.moveTo(cardX, cardY + 4 * scale);
        ctx.lineTo(corners[1].x - 10 * scale, cardY + 4 * scale);
        ctx.strokeStyle = `rgba(13, 148, 136, ${depthAlpha * 0.2})`;
        ctx.lineWidth = 0.5 * scale;
        ctx.stroke();

        cardY += 16 * scale;

        // Render dynamic graphics or rows depending on type
        if (card.type === 'ecg') {
          // ECG Wave renderer inside Vital telemetry card
          card.ecgIndex++;
          if (card.ecgIndex % 3 === 0) {
            // Shift points and add next element from ECG sequence
            card.ecgPoints.shift();
            const sequenceIdx = Math.floor(card.ecgIndex / 3) % rawEcg.length;
            const targetEcgVal = rawEcg[sequenceIdx] * 20 * scale;
            card.ecgPoints.push(targetEcgVal);
          }

          // Draw the ECG running wave
          ctx.beginPath();
          const ecgStepWidth = (card.width - 20) / ecgBufferLength * scale;
          for (let pIdx = 0; pIdx < card.ecgPoints.length; pIdx++) {
            const xVal = cardX + pIdx * ecgStepWidth;
            const yVal = corners[2].y - 20 * scale - card.ecgPoints[pIdx];
            if (pIdx === 0) ctx.moveTo(xVal, yVal);
            else ctx.lineTo(xVal, yVal);
          }
          ctx.strokeStyle = `rgba(20, 184, 166, ${depthAlpha * 0.95})`;
          ctx.lineWidth = 1.25 * scale;
          ctx.stroke();

          // Render metadata stats
          ctx.font = `${Math.round(6 * scale)}px "IBM Plex Mono", monospace`;
          ctx.fillStyle = `rgba(255, 255, 255, ${depthAlpha * 0.65})`;
          ctx.fillText('ECG MONITOR: ACTIVE', cardX, cardY);
          ctx.fillText('HR ALARM: NOMINAL', cardX, cardY + 8 * scale);
        } else {
          // Regular text-based cards
          ctx.font = `${Math.round(6.5 * scale)}px "IBM Plex Mono", monospace`;
          ctx.fillStyle = `rgba(255, 255, 255, ${depthAlpha * 0.8})`;

          card.lines.forEach((line, lIdx) => {
            const labelValueSplit = line.split(':');
            if (labelValueSplit.length === 2) {
              ctx.fillStyle = `rgba(148, 163, 184, ${depthAlpha * 0.75})`;
              ctx.fillText(labelValueSplit[0] + ':', cardX, cardY + lIdx * 12 * scale);
              ctx.fillStyle = `rgba(255, 255, 255, ${depthAlpha * 0.9})`;
              ctx.fillText(labelValueSplit[1], cardX + 50 * scale, cardY + lIdx * 12 * scale);
            } else {
              ctx.fillText(line, cardX, cardY + lIdx * 12 * scale);
            }
          });
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};

export default Medical3DBackground;
