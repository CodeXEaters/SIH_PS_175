import { useState, useRef, useEffect } from 'react';

export function InteractiveTerrainPreview({ enter }: { enter: () => void }) {
  const [wireframe, setWireframe] = useState(false);
  const [contours, setContours] = useState(true);
  const [rotation, setRotation] = useState({ x: 22, y: -18 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/assets/hero-earth-himalaya.png';

    const render = () => {
      const w = canvas.width = canvas.parentElement?.clientWidth || 800;
      const h = canvas.height = canvas.parentElement?.clientHeight || 560;

      // Dark volcanic background
      ctx.fillStyle = '#070A09';
      ctx.fillRect(0, 0, w, h);

      // Subtle radial backdrop
      const grad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, Math.max(w, h) * 0.6);
      grad.addColorStop(0, '#121513');
      grad.addColorStop(1, '#070A09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const drawW = w * 0.88;
      const drawH = h * 0.82;
      const drawX = (w - drawW) / 2;
      const drawY = (h - drawH) / 2;

      ctx.save();
      // Simulated 3D tilt
      ctx.translate(w / 2, h / 2);
      ctx.transform(1, Math.tan((rotation.y * Math.PI) / 180) * 0.35, Math.tan((rotation.x * Math.PI) / 180) * 0.25, 0.88, 0, 0);
      ctx.translate(-w / 2, -h / 2);

      // Draw base image
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      } else {
        ctx.fillStyle = '#121513';
        ctx.fillRect(drawX, drawY, drawW, drawH);
      }

      // Wireframe overlay
      if (wireframe) {
        ctx.strokeStyle = 'rgba(208, 173, 112, 0.45)';
        ctx.lineWidth = 0.8;
        const gridX = 24;
        const gridY = 18;
        for (let i = 0; i <= gridX; i++) {
          ctx.beginPath();
          const gx = drawX + (i / gridX) * drawW;
          ctx.moveTo(gx, drawY);
          ctx.lineTo(gx, drawY + drawH);
          ctx.stroke();
        }
        for (let j = 0; j <= gridY; j++) {
          ctx.beginPath();
          const gy = drawY + (j / gridY) * drawH;
          ctx.moveTo(drawX, gy);
          ctx.lineTo(drawX + drawW, gy);
          ctx.stroke();
        }
      }

      // Topographic contours
      if (contours) {
        ctx.strokeStyle = 'rgba(241, 236, 226, 0.25)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 8; i++) {
          ctx.beginPath();
          const rx = (drawW * 0.45 * i) / 8;
          const ry = (drawH * 0.40 * i) / 8;
          ctx.ellipse(drawX + drawW * 0.52, drawY + drawH * 0.48, rx, ry, 0.1, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Perimeter gold keyline
      ctx.strokeStyle = 'rgba(181, 138, 74, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX, drawY, drawW, drawH);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    img.onload = render;
    render();

    return () => cancelAnimationFrame(animId);
  }, [wireframe, contours, rotation]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation(r => ({
      x: Math.max(-40, Math.min(40, r.x + dy * 0.25)),
      y: Math.max(-40, Math.min(40, r.y + dx * 0.25))
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  return (
    <section id="terrain-preview" className="terrain-preview-section">
      <div className="animate-on-scroll">
        <p className="kicker">
          SPATIAL INTERACTION
        </p>
        <h2 style={{ font: '600 clamp(2.4rem, 4.5vw, 4.8rem)/0.96 var(--font-ui)', letterSpacing: '-2px', margin: 0 }}>
          Enter the reconstruction.<br/>
          <i style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic' }}>
            A world you can navigate.
          </i>
        </h2>
        <p style={{ maxWidth: '640px', color: 'var(--stone)', fontSize: '1.05rem', lineHeight: 1.7, margin: '24px 0 0 0' }}>
          Interact directly with the reconstructed surface below. Drag to orbit the 3D elevation field, toggle wireframe triangulation, and inspect topographic contours before stepping into the complete workspace.
        </p>
      </div>

      <div className="preview-viewport-shell animate-on-scroll">
        <div
          style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {/* Quick controls strip */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          gap: 8,
          zIndex: 10
        }}>
          <button
            onClick={() => setWireframe(!wireframe)}
            style={{
              background: wireframe ? 'rgba(181, 138, 74, 0.3)' : 'rgba(18, 21, 19, 0.85)',
              border: '1px solid var(--smoked-border)',
              color: wireframe ? 'var(--gold-glow)' : 'var(--stone)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              font: '500 9px var(--font-mono)',
              cursor: 'pointer'
            }}
          >
            # WIREFRAME {wireframe ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setContours(!contours)}
            style={{
              background: contours ? 'rgba(181, 138, 74, 0.3)' : 'rgba(18, 21, 19, 0.85)',
              border: '1px solid var(--smoked-border)',
              color: contours ? 'var(--gold-glow)' : 'var(--stone)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              font: '500 9px var(--font-mono)',
              cursor: 'pointer'
            }}
          >
            ≋ CONTOURS {contours ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setRotation({ x: 22, y: -18 })}
            style={{
              background: 'rgba(18, 21, 19, 0.85)',
              border: '1px solid var(--smoked-border)',
              color: 'var(--stone)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              font: '500 9px var(--font-mono)',
              cursor: 'pointer'
            }}
          >
            ↺ RESET CAMERA
          </button>
        </div>

        {/* Action prompt bottom */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 10
        }}>
          <button
            onClick={enter}
            style={{
              background: 'linear-gradient(135deg, var(--gold-glow), var(--gold))',
              color: '#0c0f0e',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              font: '700 10px var(--font-mono)',
              letterSpacing: 1,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(181, 138, 74, 0.3)'
            }}
          >
            Open Full 3D Workspace &amp; Flythrough →
          </button>
        </div>
      </div>
    </section>
  );
}
