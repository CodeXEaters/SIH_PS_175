export function ApplicationsSection() {
  const apps = [
    {
      kicker: 'HAZARD MITIGATION',
      title: 'Disaster Response & Inundation',
      desc: 'Rapid elevation recovery across floodplains and earthquake-damaged slopes from a single optical pass, enabling timely hydrologic routing and evacuation planning.',
      metric: 'RAPID ASSESSMENT'
    },
    {
      kicker: 'CIVIL ENGINEERING',
      title: 'Infrastructure & Corridor Planning',
      desc: 'Generate immediate longitudinal road cross-sections, cut-and-fill volume estimations, and slope steepness profiles across remote, inaccessible mountainous passes.',
      metric: 'CORRIDOR PROFILES'
    },
    {
      kicker: 'URBAN MORPHOLOGY',
      title: 'Urban Topography & Structural Height',
      desc: 'Isolate street-level ground datum from building masses to quantify building heights, solar shadows, and municipal drainage patterns without dense LiDAR passes.',
      metric: 'STRUCTURE SEGREGATION'
    },
    {
      kicker: 'HYDROLOGY',
      title: 'Watershed & Environmental Monitoring',
      desc: 'Map glacial moraine retreat, catchment basins, and alpine erosion gullies over time using archival single-image satellite collections.',
      metric: 'BASIN DELINEATION'
    },
    {
      kicker: 'LAND MANAGEMENT',
      title: 'Agriculture & Terraced Topography',
      desc: 'Quantify slope aspect and terrace elevations for precision irrigation, drainage planning, and soil conservation on steep agricultural landscapes.',
      metric: 'DRAINAGE MODELING'
    },
    {
      kicker: 'REMOTE ACCESS',
      title: 'Difficult Terrain Reconnaissance',
      desc: 'Reconstruct explorable 3D synthetic flythroughs of hazardous alpine valleys and cliff escarpments prior to field deployment.',
      metric: 'VIRTUAL FLYTHROUGH'
    }
  ];

  return (
    <section id="applications" className="applications-section">
      <div className="animate-on-scroll">
        <p className="kicker">
          APPLICATIONS &amp; USE CASES
        </p>
        <h2 style={{ font: '600 clamp(2.4rem, 4.5vw, 4.8rem)/0.96 var(--font-ui)', letterSpacing: '-2px', margin: 0 }}>
          Where terrain intelligence<br/>
          <i style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic' }}>
            changes decisions.
          </i>
        </h2>
        <p style={{ maxWidth: '640px', color: 'var(--stone)', fontSize: '1.05rem', lineHeight: 1.7, margin: '24px 0 0 0' }}>
          When stereoscopic satellite constellations or airborne LiDAR flights are unavailable, Bhudarpan provides immediate spatial elevation intelligence from ordinary optical imagery.
        </p>
      </div>

      <div className="applications-grid animate-on-scroll">
        {apps.map((app, i) => (
          <div key={app.title} className="application-card" style={{ transitionDelay: `${i * 60}ms` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <small>{app.kicker}</small>
              <span style={{
                font: '500 8px var(--font-mono)',
                color: 'var(--ash)',
                background: 'rgba(7, 10, 9, 0.7)',
                padding: '2px 6px',
                borderRadius: 2,
                border: '1px solid var(--smoked-border)'
              }}>
                {app.metric}
              </span>
            </div>
            <h3>{app.title}</h3>
            <p>{app.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
