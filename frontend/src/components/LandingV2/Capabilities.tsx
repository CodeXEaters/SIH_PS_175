// Coherent Lucide-style stroke-based iconography (26px, stroke 1.5)
const IconDepth = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
    <path d="M4.14 15.08l6.36-2.58" />
  </svg>
);

const IconSemantic = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IconCalibration = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconUncertainty = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
    <path d="M6 14c2.5-3 4-7 6-10 2.5 3 4 5 6 6" strokeDasharray="2 2" />
  </svg>
);

const capabilities = [
  {
    icon: <IconDepth />,
    name: 'Monocular Depth Estimation',
    desc: 'Deep learning foundation model recovering dense relative depth geometry from monocular orbital inputs.',
  },
  {
    icon: <IconSemantic />,
    name: 'Semantic Ground Identification',
    desc: 'Isolating bare ground pixels from canopy, water, shadow, and structures to ground geometric estimations.',
  },
  {
    icon: <IconCalibration />,
    name: 'Geospatial Calibration',
    desc: 'Rigorous coordinate scaling and anchor registration to transform relative predictions into metric coordinates.',
  },
  {
    icon: <IconUncertainty />,
    name: 'Uncertainty Estimation',
    desc: 'Pixel-level confidence metrics and error heatmaps quantifying reconstruction reliability across complex terrain.',
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="capabilities-section" aria-label="Key capabilities">
      <div className="container">
        {/* Header */}
        <div className="capabilities-header reveal">
          <p className="eyebrow">KEY CAPABILITIES</p>
          <h2 className="section-title">
            More than a pretty map.
          </h2>
          <p className="capabilities-subtitle">
            A scientific terrain reconstruction pipeline.
          </p>
        </div>

        {/* 4-Column Editorial Grid (No boxed cards, subtle column dividers) */}
        <div className="capabilities-grid" role="list" aria-label="Scientific capabilities">
          {capabilities.map((cap, i) => (
            <div
              key={cap.name}
              className={`capability-item reveal reveal-d${i + 1}`}
              role="listitem"
            >
              <div className="cap-icon" aria-hidden="true">
                {cap.icon}
              </div>
              <span className="cap-name">{cap.name}</span>
              <p className="cap-desc">{cap.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
