import { useEffect, useState, useCallback } from 'react';
import { LandingV2 } from './components/LandingV2/LandingV2';
import { Workspace } from './components/Workspace/Workspace';

export function App() {
  const pageForPath = () => location.pathname.startsWith('/workspace') ? 'workspace' : 'landing';
  const [page, setPage] = useState(pageForPath);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const sync = () => setPage(pageForPath());
    addEventListener('popstate', sync);
    return () => removeEventListener('popstate', sync);
  }, []);

  const navigate = useCallback((path: '/' | '/workspace') => {
    setTransitioning(true);
    setTimeout(() => {
      history.pushState({}, '', path);
      setPage(path === '/' ? 'landing' : 'workspace');
      window.scrollTo({ top: 0, behavior: 'instant' });
      // Allow new page to paint before fading in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitioning(false));
      });
    }, 400); // Match CSS transition duration
  }, []);

  return (
    <div className={`page-transition-wrapper ${transitioning ? 'page-exit' : 'page-enter'}`}>
      {page === 'workspace'
        ? <Workspace goHome={() => navigate('/')} />
        : <LandingV2 enter={() => navigate('/workspace')} />
      }
    </div>
  );
}
