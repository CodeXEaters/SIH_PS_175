import { useEffect, useRef } from 'react';

type DeepEarthAtmosphereProps = {
  mouseOffset: { x: number, y: number };
};

export function DeepEarthAtmosphere({ mouseOffset }: DeepEarthAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Particle definitions
    const particles: any[] = [];
    
    // Type A: Atmospheric Dust (70%)
    for (let i = 0; i < 150; i++) {
      particles.push({
        type: 'dust',
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.1,
        speedY: (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.15 + 0.05
      });
    }

    // Type B: Geo Observation Points (15%)
    for (let i = 0; i < 30; i++) {
      particles.push({
        type: 'point',
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01
      });
    }

    // Type C: Contour Fragments (10%)
    for (let i = 0; i < 15; i++) {
      particles.push({
        type: 'contour',
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 100 + 50,
        startAngle: Math.random() * Math.PI,
        arc: Math.random() * Math.PI / 2 + 0.5,
        rotation: (Math.random() - 0.5) * 0.005,
        opacity: Math.random() * 0.05 + 0.02
      });
    }

    // Type D: Scan Signals (5%)
    for (let i = 0; i < 3; i++) {
      particles.push({
        type: 'scan',
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 100 + 50,
        progress: Math.random(),
        speed: Math.random() * 0.005 + 0.002
      });
    }

    const draw = () => {
      // Clear with Volcanic Black base
      ctx.fillStyle = '#070807';
      ctx.fillRect(0, 0, width, height);
      
      // Draw a subtle atmospheric gradient
      const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      grad.addColorStop(0, '#101210'); // Basalt in center
      grad.addColorStop(1, '#070807'); // Volcanic at edges
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render Particles with parallax offset
      particles.forEach(p => {
        let parallaxX = 0;
        let parallaxY = 0;
        
        if (p.type === 'dust') {
          parallaxX = mouseOffset.x * 2;
          parallaxY = mouseOffset.y * 2;
          p.x += p.speedX;
          p.y += p.speedY;
          
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.fillStyle = `rgba(139, 139, 128, ${p.opacity})`; // Stone color
          ctx.beginPath();
          ctx.arc(p.x + parallaxX, p.y + parallaxY, p.size, 0, Math.PI * 2);
          ctx.fill();
        } 
        else if (p.type === 'point') {
          parallaxX = mouseOffset.x * 4;
          parallaxY = mouseOffset.y * 4;
          p.phase += p.speed;
          const currentOpacity = (Math.sin(p.phase) + 1) / 2 * 0.6 + 0.1;
          
          ctx.fillStyle = `rgba(181, 150, 88, ${currentOpacity})`; // Mineral Gold
          ctx.beginPath();
          ctx.arc(p.x + parallaxX, p.y + parallaxY, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        else if (p.type === 'contour') {
          parallaxX = mouseOffset.x * 1;
          parallaxY = mouseOffset.y * 1;
          p.startAngle += p.rotation;
          
          ctx.strokeStyle = `rgba(181, 150, 88, ${p.opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x + parallaxX, p.y + parallaxY, p.radius, p.startAngle, p.startAngle + p.arc);
          ctx.stroke();
        }
        else if (p.type === 'scan') {
          parallaxX = mouseOffset.x * 6;
          parallaxY = mouseOffset.y * 6;
          p.progress += p.speed;
          if (p.progress > 1) {
            p.progress = 0;
            p.x = Math.random() * width;
            p.y = Math.random() * height;
          }
          
          const scanOpacity = Math.sin(p.progress * Math.PI) * 0.5;
          ctx.strokeStyle = `rgba(208, 183, 124, ${scanOpacity})`; // Weathered Sandstone
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x + parallaxX, p.y + parallaxY);
          ctx.lineTo(p.x + p.length + parallaxX, p.y + parallaxY);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mouseOffset]);

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
        pointerEvents: 'none'
      }}
    />
  );
}
