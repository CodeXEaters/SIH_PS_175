import { useEffect, useState } from 'react';

export function FloatingNavbar({ enter }: { enter: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`animate-on-scroll ${scrolled ? 'scrolled' : ''}`} style={{
      height: '80px',
      position: 'fixed',
      zIndex: 100,
      left: 0,
      right: 0,
      top: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 clamp(24px, 5vw, 64px)',
      background: scrolled ? 'var(--smoked-glass)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--smoked-border)' : '1px solid transparent',
      transition: 'all 0.4s ease'
    }}>
      <a className="wordmark" href="#top" style={{ color: 'var(--text)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, letterSpacing: '1.5px', fontSize: '13px' }}>
        <b style={{ display: 'grid', placeItems: 'center', border: '1px solid var(--gold)', borderRadius: '50%', width: '30px', height: '30px', color: 'var(--gold)', font: '20px "Playfair Display"' }}>D</b>
        DEPTHWIZARD
      </a>
      
      <nav style={{ display: 'flex', gap: '48px' }}>
        {['Product', 'Technology', 'Workflow', 'Applications'].map(item => (
          <a key={item} href={`#${item.toLowerCase()}`} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s' }}
             onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
             onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
            {item}
          </a>
        ))}
      </nav>

      <button className="outline" onClick={enter} style={{
        border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)',
        padding: '12px 16px', borderRadius: '2px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
        transition: 'all 0.3s ease', cursor: 'pointer'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(181, 150, 88, 0.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        Launch Workspace →
      </button>
    </header>
  );
}
