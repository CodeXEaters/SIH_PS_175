import { useEffect, useState } from 'react';

const capabilities = [
  ['01', 'Terrain reconstruction', 'Turn a single optical image into a navigable digital surface with meaningful spatial structure.'],
  ['02', 'Elevation intelligence', 'Inspect height, slope, aspect, and surface variation with a clear analytical layer.'],
  ['03', '3D exploration', 'Move through reconstructed landscapes and inspect the terrain from every useful angle.'],
  ['04', 'Geospatial context', 'Bring locations, calibration, and semantic ground understanding into one working view.'],
];
const steps = [
  ['01', 'Input', 'Bring satellite imagery into the workspace.'], ['02', 'Process', 'Estimate depth and identify terrain surfaces.'],
  ['03', 'Generate', 'Build a calibrated terrain reconstruction.'], ['04', 'Explore', 'Analyse, measure, and export findings.'],
];

export function Landing({ enter }: { enter: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 24); addEventListener('scroll', onScroll, { passive: true }); return () => removeEventListener('scroll', onScroll); }, []);
  const closeMenu = () => setMenuOpen(false);
  return <main className="terrain-landing">
    <header className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <a href="#home" className="brand" onClick={closeMenu} aria-label="Bhudarpan home"><span className="brand-mark" aria-hidden="true">⌁</span><span><strong>Bhudarpan</strong><small>Seeing a deeper Earth</small></span></a>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>Menu</button>
      <nav className={menuOpen ? 'open' : ''} aria-label="Main navigation"><a href="#platform" onClick={closeMenu}>Platform</a><a href="#workflow" onClick={closeMenu}>Workflow</a><a href="#technology" onClick={closeMenu}>Technology</a><a href="#impact" onClick={closeMenu}>Applications</a><a href="#about" onClick={closeMenu}>About</a></nav>
      <button className="button primary nav-cta" onClick={enter}>Explore Platform <span>→</span></button>
    </header>
    <section className="terrain-hero" id="home">
      <div className="hero-art" role="img" aria-label="Satellite view of India and the Himalayas transitioning into a three-dimensional terrain model" />
      <div className="hero-copy"><p className="eyebrow">Satellite imagery <i /> Terrain intelligence</p><h1>See the terrain.<br /><em>Understand the Earth.</em></h1><p className="lede">Bhudarpan transforms satellite imagery into detailed terrain intelligence for clearer visualisation, faster analysis, and grounded decisions.</p><div className="hero-actions"><button className="button primary" onClick={enter}>Explore the platform <span>→</span></button><a className="button secondary" href="#workflow">View how it works <span>↓</span></a></div><div className="hero-metadata"><span><b>01</b> image input</span><span><b>3D</b> terrain output</span><span><b>Live</b> spatial analysis</span></div></div>
      <aside className="telemetry" aria-label="Example terrain telemetry"><p><i /> Live view</p><dl><dt>LAT</dt><dd>27.9881° N</dd><dt>LON</dt><dd>86.9250° E</dd><dt>ELEV</dt><dd>4,832 m</dd><dt>GSD</dt><dd>0.5 m/px</dd></dl></aside><a className="scroll-cue" href="#platform">Scroll to explore <span>↓</span></a>
    </section>
    <section className="intro section" id="platform"><div><p className="eyebrow">The platform</p><h2>From raw data to<br /><em>terrain intelligence.</em></h2></div><div className="intro-detail"><p>One photograph is flat. The landscape behind it is not. Bhudarpan joins visual depth, ground understanding, and geospatial calibration to create an interactive model of the world.</p><a href="#workflow">Follow the reconstruction <span>→</span></a></div><div className="data-flow" aria-label="Satellite data processing workflow">{['Satellite data', 'Depth estimation', 'Terrain reconstruction', 'Interactive analysis'].map((item, i) => <div key={item}><b>0{i + 1}</b><span>{item}</span></div>)}</div></section>
    <section className="capabilities section"><p className="eyebrow">Core capabilities</p><h2>Built for spatial<br />understanding.</h2><div className="capability-grid">{capabilities.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="preview section" id="technology"><div className="preview-heading"><p className="eyebrow">Interactive workspace</p><h2>Explore what<br />the image reveals.</h2><p>Layer imagery, terrain, elevation, and uncertainty in a single precise working environment.</p><button className="text-link" onClick={enter}>Open the workspace <span>→</span></button></div><div className="workspace-preview" role="img" aria-label="Bhudarpan terrain analysis workspace preview"><div className="preview-top"><span>BHDR / HIMALAYA-01</span><span>Terrain · Elevation · Slope</span></div><div className="preview-map"><div className="map-data"><b>4,832m</b><small>Peak elevation</small></div><div className="map-legend"><span>Elev.</span><i /><small>1,280—4,832m</small></div></div><div className="preview-bottom"><span><i /> Reconstruction ready</span><span>27.9881° N &nbsp; 86.9250° E</span></div></div></section>
    <section className="journey section" id="workflow"><p className="eyebrow">How it works</p><h2>A clear path from image to insight.</h2><div className="step-grid">{steps.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="impact section" id="impact"><div><p className="eyebrow">Real-world impact</p><h2>Designed for the<br />decisions ahead.</h2><p>Accessible terrain intelligence supports the people planning, responding to, and studying a changing landscape.</p></div><ul><li>Environmental monitoring</li><li>Disaster assessment</li><li>Infrastructure planning</li><li>Research &amp; education</li><li>Policy &amp; governance</li></ul></section>
    <section className="final-cta section" id="about"><p className="eyebrow">A clearer perspective</p><h2>Explore the landscape differently.</h2><p>Move from a single image to a deeper understanding of the terrain.</p><button className="button primary" onClick={enter}>Launch platform <span>→</span></button></section>
    <footer><div className="brand"><span className="brand-mark" aria-hidden="true">⌁</span><span><strong>Bhudarpan</strong><small>Seeing a deeper Earth</small></span></div><p>© 2026 Bhudarpan. Built for Smart India Hackathon.</p><div><a href="#platform">Platform</a><a href="#technology">Technology</a><a href="#about">About</a></div></footer>
  </main>;
}
