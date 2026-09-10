// Coherent Lucide-style stroke iconography for application areas
const IconLeaf = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 20A7 7 0 014 13c0-5 3.5-9 9-9 0 0 7 .5 7 7 0 5.5-4.5 9-9 9z" />
    <path d="M11 20c0-4 2-7 6-9" />
  </svg>
);

const IconShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconBuilding = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <path d="M9 22v-4h6v4" />
    <line x1="8" y1="6" x2="10" y2="6" />
    <line x1="14" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="10" y2="10" />
    <line x1="14" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="10" y2="14" />
    <line x1="14" y1="14" x2="16" y2="14" />
  </svg>
);

const IconBook = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);

const IconGlobe = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const applications = [
  { icon: <IconLeaf />,     name: 'Environmental\nMonitoring' },
  { icon: <IconShield />,   name: 'Disaster\nManagement' },
  { icon: <IconBuilding />, name: 'Infrastructure\nPlanning' },
  { icon: <IconBook />,     name: 'Research &\nEducation' },
  { icon: <IconGlobe />,    name: 'Policy &\nGovernance' },
];

export function RealWorldImpact() {
  return (
    <section id="impact" className="impact-section" aria-label="Real world impact">
      <div className="container">
        {/* Left: Narrative with editorial spacing */}
        <div className="impact-left">
          <p className="eyebrow reveal">REAL WORLD IMPACT</p>
          <h2 className="section-title reveal reveal-d1">
            Built for a more<br />informed world.
          </h2>
          <p className="section-body reveal reveal-d2" style={{ marginTop: '18px' }}>
            From disaster response to infrastructure planning,
            Bhudarpan enables better decisions with accessible
            3D terrain intelligence.
          </p>
        </div>

        {/* Right: Application items (No cards, clean icons & typography with negative space) */}
        <div className="impact-apps reveal reveal-d2" role="list" aria-label="Application areas">
          {applications.map((app) => (
            <div key={app.name} className="impact-app" role="listitem">
              <div className="impact-app-icon" aria-hidden="true">
                {app.icon}
              </div>
              <span className="impact-app-name" style={{ whiteSpace: 'pre-line' }}>
                {app.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
