import { useEffect, useRef } from 'react';

type DeepEarthAtmosphereProps = {
  mouseOffset: { x: number; y: number };
};

interface Particle {
  type: 'dust' | 'point' | 'contour';
  x: number;
  y: number;
  size?: number;
  speedX?: number;
  speedY?: number;
  opacity?: number;
  phase?: number;
  speed?: number;
  radius?: number;
  startAngle?: number;
  arc?: number;
  rotation?: number;
}

export function DeepEarthAtmosphere({ mouseOffset }: DeepEarthAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef(mouseOffset);

  mouseRef.current = mouseOffset;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animId: number;

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Create restrained, subtle geological particles
    if (particlesRef.current.length === 0) {
      const particles: Particle[] = [];

      // Very faint atmospheric mineral dust
      for (let i = 0; i < 70; i++) {
        particles.push({
          type: 'dust',
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.2 + 0.4,
          speedX: (Math.random() - 0.5) * 0.04,
          speedY: (Math.random() - 0.5) * 0.04,
          opacity: Math.random() * 0.08 + 0.02,
        });
      }

      // Rare geospatial survey anchor points (slow pulse)
      for (let i = 0; i < 16; i++) {
        particles.push({
          type: 'point',
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 1,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.008 + 0.003,
        });
      }

      // Subtle contour curve arcs
      for (let i = 0; i < 8; i++) {
        particles.push({
          type: 'contour',
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 140 + 70,
          startAngle: Math.random() * Math.PI,
          arc: Math.random() * Math.PI * 0.4 + 0.3,
          rotation: (Math.random() - 0.5) * 0.0015,
          opacity: Math.random() * 0.03 + 0.01,
        });
      }

      particlesRef.current = particles;
    }

    const draw = () => {
      const mo = mouseRef.current;

      // 1. Base atmospheric midnight #06131D
      ctx.fillStyle = '#06131D';
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle center radial atmospheric gradient
      const grad = ctx.createRadialGradient(width * 0.6, height * 0.4, 60, width * 0.6, height * 0.4, width);
      grad.addColorStop(0, '#0D1E28');
      grad.addColorStop(1, '#06131D');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      for (const p of particlesRef.current) {
        if (p.type === 'dust') {
          const px = mo.x * 1.5;
          const py = mo.y * 1.5;
          p.x += p.speedX!;
          p.y += p.speedY!;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.fillStyle = `rgba(169, 164, 154, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x + px, p.y + py, p.size!, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'point') {
          const px = mo.x * 2.5;
          const py = mo.y * 2.5;
          p.phase! += p.speed!;
          const op = (Math.sin(p.phase!) + 1) / 2 * 0.25 + 0.05;

          ctx.fillStyle = `rgba(181, 138, 74, ${op})`;
          ctx.beginPath();
          ctx.arc(p.x + px, p.y + py, p.size!, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'contour') {
          const px = mo.x * 0.8;
          const py = mo.y * 0.8;
          p.startAngle! += p.rotation!;

          ctx.strokeStyle = `rgba(181, 138, 74, ${p.opacity})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(p.x + px, p.y + py, p.radius!, p.startAngle!, p.startAngle! + p.arc!);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
