import { useEffect, useRef } from 'react';

export function HeroCinematic({ enter }: { enter: () => void }) {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number | null = null;
    let latestX = 0;
    let latestY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      latestX = (e.clientX / window.innerWidth - 0.5) * 14;
      latestY = (e.clientY / window.innerHeight - 0.5) * 8;
      if (raf === null) {
        raf = requestAnimationFrame(() => {
          if (imageRef.current) {
            imageRef.current.style.transform = `translate(${latestX * 0.5}px, ${latestY * 0.5}px) scale(1.04)`;
          }
          raf = null;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="top" className="hero">
      {/* Earth/Himalaya Full-Bleed Environmental Layer */}
      <div className="hero-image" ref={imageRef} aria-hidden="true" />

      {/* Atmospheric left-panel text zone */}
      <div className="hero-content animate-on-scroll">
        <p className="kicker" aria-label="Product descriptor">
          EARTH OBSERVATION · TERRAIN INTELLIGENCE
        </p>

        <h1>
          FROM PIXELS<br/>
          TO <i>terrain.</i>
        </h1>

        <p>
          A single optical image can reveal more than its surface.
          BHUDARPAN interprets spatial structure, anchors scale where
          reference data is available, and turns imagery into explorable terrain.
        </p>

        <div className="buttons">
          <button onClick={enter} id="hero-cta-primary" aria-label="Open workspace">
            EXPLORE THE RECONSTRUCTION →
          </button>
          <a href="#story" id="hero-cta-secondary" aria-label="Learn how it works">
            SEE HOW IT WORKS
          </a>
        </div>
      </div>

      {/* Observational Demo Scene Panel — Strictly marked DEMO SCENE */}
      <aside aria-label="Demo scene telemetry">
        <small>● DEMO SCENE</small>
        <dl>
          <dt>LAT</dt><dd>27.9881° N</dd>
          <dt>LON</dt><dd>86.9250° E</dd>
          <dt>GSD</dt><dd>0.50 m/px</dd>
          <dt>ELEV</dt><dd>4,824.2 M</dd>
          <dt>SLOPE</dt><dd>28.4°</dd>
          <dt>MODE</dt><dd style={{ color: 'var(--gold-glow)' }}>METRIC</dd>
        </dl>
      </aside>

      {/* Bottom Status Indicators */}
      <div className="hero-signals" aria-label="System status">
        <span><i /> DEPTH ENGINE · READY</span>
        <span><i style={{ background: 'var(--depth-cyan)' }} /> 3D TERRAIN · READY</span>
        <span><i style={{ background: 'var(--stone)', opacity: 0.5 }} /> CALIBRATION · AWAITING INPUT</span>
      </div>

      <div className="hero-scroll-prompt" aria-hidden="true">
        <span>↓</span>
        SCROLL TO EXPLORE
      </div>
    </section>
  );
}
