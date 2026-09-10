import { useEffect, useState } from 'react';

export function FloatingNavbar({ enter }: { enter: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={scrolled ? 'scrolled' : ''} style={{
      background: scrolled ? 'var(--smoked-glass)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--smoked-border)' : '1px solid transparent',
    }}>
      <a className="wordmark" href="#top">
        <b>B</b>
        <span>BHUDARPAN</span>
      </a>
      
      <nav>
        <a href="#story">Story</a>
        <a href="#semantic-ground">Perception</a>
        <a href="#calibration">Calibration</a>
        <a href="#uncertainty">Uncertainty</a>
        <a href="#terrain-preview">3D Terrain</a>
        <a href="#applications">Applications</a>
      </nav>

      <button className="outline" onClick={enter}>
        Launch Workspace →
      </button>
    </header>
  );
}
