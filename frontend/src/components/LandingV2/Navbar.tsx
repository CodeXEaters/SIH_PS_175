import { useEffect, useState } from 'react';

interface NavbarProps {
  onLaunchWorkspace: () => void;
}

export function Navbar({ onLaunchWorkspace }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`navbar-v2 ${scrolled ? 'scrolled' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container">
        {/* Brand: Quiet & Mature */}
        <a href="#top" className="nav-logo" aria-label="Bhudarpan home">
          <div className="nav-logo-mark" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" stroke="#58C6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="8" strokeOpacity="0.8" />
              <path d="M4 11c2-2.5 4-2.5 6 0s4 2.5 6 0" strokeOpacity="0.9" />
              <path d="M5.5 8c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0" strokeOpacity="0.6" />
            </svg>
          </div>
          <div className="nav-logo-text">
            <span className="nav-logo-name">BHUDARPAN</span>
            <span className="nav-logo-tagline">Seeing a deeper Earth.</span>
          </div>
        </a>

        {/* Center Nav Links */}
        <ul className="nav-links" role="list">
          <li><a href="#transformation">Product</a></li>
          <li><a href="#capabilities">Technology</a></li>
          <li><a href="#interactive">Workflow</a></li>
          <li><a href="#impact">Applications</a></li>
          <li><a href="#footer">About</a></li>
        </ul>

        {/* Primary Action */}
        <button
          id="nav-launch-workspace"
          className="btn-primary"
          onClick={onLaunchWorkspace}
          aria-label="Launch workspace"
        >
          Launch Workspace →
        </button>
      </div>
    </nav>
  );
}
