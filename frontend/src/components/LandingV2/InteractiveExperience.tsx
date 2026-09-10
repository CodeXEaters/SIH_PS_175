import { useEffect, useRef, useState } from 'react';

// Clean stroke checkmark icon for capabilities list
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const capabilitiesList = [
  '3D terrain visualization',
  'Elevation & slope analysis',
  'Layer comparison',
  'Point query & measurement tools',
  'Uncertainty heatmaps',
  'Export',
];

export function InteractiveExperience({ onEnter }: { onEnter: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50); // percentage
  const dragging = useRef(false);

  const onMouseDown = () => {
    dragging.current = true;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      setSplit(x);
    };
    const onMouseUp = () => {
      dragging.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = Math.max(5, Math.min(95, ((touch.clientX - rect.left) / rect.width) * 100));
      setSplit(x);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  return (
    <section id="interactive" className="interactive-section" aria-label="Interactive experience">
      <div className="container">
        {/* Left: 2D satellite image vs 3D terrain reconstruction split slider */}
        <div
          ref={containerRef}
          className="terrain-comparison reveal"
          onMouseDown={onMouseDown}
          onTouchStart={onMouseDown}
          role="region"
          aria-label="Interactive comparison: 2D satellite image vs 3D terrain reconstruction"
        >
          {/* Before: 2D satellite */}
          <div className="tc-before">
            <img
              src="/assets/terrain-satellite.jpg"
              alt="2D optical satellite mountain imagery"
              loading="lazy"
            />
          </div>

          {/* After: 3D terrain reconstruction */}
          <div
            className="tc-after"
            style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          >
            <img
              src="/assets/terrain-3d.jpg"
              alt="3D reconstructed terrain elevation mesh"
              loading="lazy"
            />
          </div>

          {/* Split divider handle */}
          <div
            className="tc-handle"
            style={{ left: `${split}%` }}
            aria-hidden="true"
          >
            <div className="tc-handle-circle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
                <polyline points="9 18 3 12 9 6" style={{ display: 'none' }} />
                <path d="M7 12h10M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" />
              </svg>
            </div>
          </div>

          {/* Scientific Labels */}
          <div className="tc-label left-label" aria-hidden="true">2D SATELLITE IMAGE</div>
          <div className="tc-label right-label" aria-hidden="true">3D TERRAIN RECONSTRUCTION</div>
        </div>

        {/* Right: Narrative and Capabilities */}
        <div className="interactive-right">
          <p className="eyebrow reveal">INTERACTIVE EXPERIENCE</p>
          <h2 className="section-title reveal reveal-d1">
            Explore. Measure.<br />Understand.
          </h2>
          <p className="section-body reveal reveal-d2">
            Visualize reconstructed terrain in 3D, query elevation,
            measure distances, analyse slope and explore uncertainty
            — all in your browser.
          </p>

          <ul className="feature-list reveal reveal-d3" role="list">
            {capabilitiesList.map((text) => (
              <li key={text}>
                <span className="fi" aria-hidden="true">
                  <CheckIcon />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <button
            id="interactive-launch-btn"
            className="btn-primary reveal reveal-d4"
            onClick={onEnter}
            aria-label="Launch workspace"
          >
            Launch Workspace →
          </button>
        </div>
      </div>
    </section>
  );
}
