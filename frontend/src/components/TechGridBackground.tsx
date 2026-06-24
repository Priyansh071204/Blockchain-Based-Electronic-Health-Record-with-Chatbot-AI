import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

const TechGridBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initial Coordinates/Telemetry markers
    const techMarkers: { x: number; y: number; text: string }[] = [];
    const markerCount = 12;

    const generateMarkers = (w: number, h: number) => {
      techMarkers.length = 0;
      for (let i = 0; i < markerCount; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const lat = (10 + Math.random() * 50).toFixed(4);
        const lon = (70 + Math.random() * 60).toFixed(4);
        techMarkers.push({
          x,
          y,
          text: `[SYS_NODE_${Math.floor(Math.random() * 99)} | ${lat}°N, ${lon}°E]`,
        });
      }
    };

    generateMarkers(width, height);

    const initParticles = () => {
      particles = [];
      const particleCount = Math.min(60, Math.floor((width * height) / 25000));
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.4 + 0.2,
        });
      }
    };

    initParticles();

    // Radar/Sonar wave variables
    let radarRadius = 0;
    const radarSpeed = 1.2;
    const radarCenter = { x: width * 0.85, y: height * 0.2 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      generateMarkers(width, height);
      initParticles();
      radarCenter.x = width * 0.85;
      radarCenter.y = height * 0.2;
    };

    window.addEventListener('resize', handleResize);

    const drawGrid = (c: CanvasRenderingContext2D, w: number, h: number) => {
      c.strokeStyle = 'rgba(0, 242, 255, 0.025)';
      c.lineWidth = 1;

      // Draw large grid lines (80px)
      const gridSize = 80;
      for (let x = 0; x < w; x += gridSize) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, h);
        c.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
      }

      // Draw fine grid lines (20px)
      c.strokeStyle = 'rgba(0, 242, 255, 0.008)';
      const fineGridSize = 20;
      for (let x = 0; x < w; x += fineGridSize) {
        if (x % gridSize === 0) continue;
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, h);
        c.stroke();
      }
      for (let y = 0; y < h; y += fineGridSize) {
        if (y % gridSize === 0) continue;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
      }
    };

    const drawRadar = (c: CanvasRenderingContext2D) => {
      radarRadius += radarSpeed;
      if (radarRadius > Math.max(width, height) * 0.3) {
        radarRadius = 0;
      }

      c.save();
      // Center indicator
      c.beginPath();
      c.arc(radarCenter.x, radarCenter.y, 4, 0, Math.PI * 2);
      c.fillStyle = 'rgba(0, 242, 255, 0.3)';
      c.fill();

      // Outer radar scanning circle
      c.beginPath();
      c.arc(radarCenter.x, radarCenter.y, 100, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(0, 242, 255, 0.04)';
      c.lineWidth = 1;
      c.stroke();

      // Expanding wave
      c.beginPath();
      c.arc(radarCenter.x, radarCenter.y, radarRadius, 0, Math.PI * 2);
      const alpha = Math.max(0, 1 - radarRadius / (Math.max(width, height) * 0.3));
      c.strokeStyle = `rgba(0, 242, 255, ${alpha * 0.06})`;
      c.lineWidth = 1.5;
      c.stroke();
      c.restore();
    };

    const drawTechTelemetry = (c: CanvasRenderingContext2D) => {
      c.font = '7px "IBM Plex Mono", monospace';
      c.fillStyle = 'rgba(0, 242, 255, 0.15)';

      techMarkers.forEach((marker) => {
        c.fillText(marker.text, marker.x, marker.y);
        
        // Draw miniature crosshair target
        c.beginPath();
        c.strokeStyle = 'rgba(0, 242, 255, 0.08)';
        c.lineWidth = 0.5;
        c.moveTo(marker.x - 4, marker.y - 3);
        c.lineTo(marker.x + 4, marker.y - 3);
        c.moveTo(marker.x, marker.y - 7);
        c.lineTo(marker.x, marker.y + 1);
        c.stroke();
      });

      // Renders screen border details
      c.strokeStyle = 'rgba(0, 242, 255, 0.05)';
      c.lineWidth = 1;
      
      // Top left corner element
      c.beginPath();
      c.moveTo(20, 40);
      c.lineTo(20, 20);
      c.lineTo(40, 20);
      c.stroke();
      
      // Bottom left corner element
      c.beginPath();
      c.moveTo(20, height - 40);
      c.lineTo(20, height - 20);
      c.lineTo(40, height - 20);
      c.stroke();

      // Top right corner element
      c.beginPath();
      c.moveTo(width - 20, 40);
      c.lineTo(width - 20, 20);
      c.lineTo(width - 40, 20);
      c.stroke();

      // Bottom right corner element
      c.beginPath();
      c.moveTo(width - 20, height - 40);
      c.lineTo(width - 20, height - 20);
      c.lineTo(width - 40, height - 20);
      c.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background styling
      drawGrid(ctx, width, height);
      drawRadar(ctx);
      drawTechTelemetry(ctx);

      // Update and draw particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 255, ${p.alpha})`;
        ctx.fill();

        // Connect adjacent particles
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alphaConn = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 242, 255, ${alphaConn})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
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

export default TechGridBackground;
