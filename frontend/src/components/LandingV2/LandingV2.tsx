import { useEffect, useRef } from 'react';
import '../../landing.css';

import { Navbar }              from './Navbar';
import { Hero }                from './Hero';
import { Transformation }      from './Transformation';
import { Capabilities }        from './Capabilities';
import { InteractiveExperience } from './InteractiveExperience';
import { RealWorldImpact }     from './RealWorldImpact';
import { FinalCTA }            from './FinalCTA';
import { Footer }              from './Footer';

interface LandingV2Props {
  enter: () => void;
}

export function LandingV2({ enter }: LandingV2Props) {
  const pageRef = useRef<HTMLDivElement>(null);

  /* ── Scroll reveal ── */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing-v2" ref={pageRef}>
      {/* Fixed navigation */}
      <Navbar onLaunchWorkspace={enter} />

      <main>
        {/* 1 — Hero */}
        <Hero onEnter={enter} />

        {/* 2 — Transformation pipeline */}
        <Transformation />

        {/* 3 — Key capabilities */}
        <Capabilities />

        {/* 4 — Interactive experience + terrain comparison */}
        <InteractiveExperience onEnter={enter} />

        {/* 5 — Real world impact */}
        <RealWorldImpact />

        {/* 6 — Final CTA / mountain sunrise */}
        <FinalCTA onEnter={enter} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
