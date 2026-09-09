import { useState, useEffect } from 'react';
import { DeepEarthAtmosphere } from './Landing/DeepEarthAtmosphere';
import { FloatingNavbar } from './Landing/FloatingNavbar';
import { HeroCinematic } from './Landing/HeroCinematic';
import { TransformationSequence } from './Landing/TransformationSequence';
import { ScientificPrecision } from './Landing/ScientificPrecision';

export function Landing({ enter }: { enter: () => void }) {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5);
      const y = (e.clientY / window.innerHeight - 0.5);
      setMouseOffset({ x, y });
    };
    
    // Throttle the mouse event slightly for performance if needed, 
    // but requestAnimationFrame inside canvas handles actual rendering.
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="landing" style={{ position: 'relative', overflowX: 'hidden' }}>
      <DeepEarthAtmosphere mouseOffset={mouseOffset} />
      
      <FloatingNavbar enter={enter} />
      
      <HeroCinematic enter={enter} />
      
      <TransformationSequence />
      
      <ScientificPrecision />

      <footer className="animate-on-scroll" style={{
        position: 'relative', zIndex: 2, borderTop: '1px solid var(--smoked-border)', 
        padding: '48px clamp(24px, 6vw, 96px)', font: '11px "DM Mono"', 
        color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', 
        textTransform: 'uppercase', letterSpacing: '1px', marginTop: '160px'
      }}>
        <span>© 2026 DEPTHWIZARD</span>
        <span>One image. A navigable world.</span>
      </footer>
    </main>
  );
}
