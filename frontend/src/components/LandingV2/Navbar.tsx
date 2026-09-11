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
        {/* Brand */}
        <a href="#top" className="nav-logo" aria-label="Bhudarpan home">
          <img
            src="/assets/bhudarpan-logo.png"
            alt="Bhudarpan"
            className="nav-logo-image"
          />
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
