import { useEffect, useRef } from 'react';

export function Landing({ enter }:{enter:()=>void}) {
  const heroRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if(!heroRef.current) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    heroRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
  };
  const handleMouseLeave = () => {
    if(!heroRef.current) return;
    heroRef.current.style.transform = 'translate(0px, 0px) scale(1)';
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="landing">
      <header className="animate-on-scroll">
        <a className="wordmark" href="#top"><b>D</b> DEPTHWIZARD</a>
        <nav><a href="#product">Product</a><a href="#workflow">Workflow</a><a href="#about">About</a></nav>
        <button className="outline" onClick={enter}>Launch Workspace ↗</button>
      </header>
      
      <section id="top" className="hero animate-on-scroll" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <div className="hero-image" ref={heroRef}/>
        <div className="hero-content">
          <p className="kicker">Remote sensing × AI × 3D</p>
          <h1>From pixels<br/>to <i>terrain.</i></h1>
          <p>DepthWizard transforms a single optical image into an interactive, measurable 3D representation of the Earth’s surface.</p>
          <div className="buttons">
            <button onClick={enter}>Explore reconstruction →</button>
            <a href="#workflow">See how it works</a>
          </div>
          <div className="signals">
            <span>◈ AI DEPTH ENGINE <b>• READY</b></span>
            <span>◎ SCIENTIFIC VISUALIZATION <b>• ONLINE</b></span>
          </div>
        </div>
        <aside>
          <small>● LIVE SCENE</small>
          <dl>
            <dt>LATITUDE</dt><dd>19.0760° N</dd>
            <dt>LONGITUDE</dt><dd>72.8777° E</dd>
            <dt>ELEVATION</dt><dd>124.7 M</dd>
            <dt>CONFIDENCE</dt><dd>93.8%</dd>
          </dl>
        </aside>
      </section>

      <section id="workflow" className="landing-workflow animate-on-scroll">
        <p className="kicker">The transformation</p>
        <h2>A photograph is flat.<br/><i>The terrain isn’t.</i></h2>
        <p className="intro">One image passes through perception, calibration and reconstruction to become a measurable world.</p>
        <div className="landing-stages">
          {['IMAGE','DEPTH','ELEVATION','TERRAIN'].map((item,i) => (
            <div key={item} className="animate-on-scroll" style={{transitionDelay: `${i * 100}ms`}}>
              <b>0{i+1}</b>
              <div className={'mini '+item.toLowerCase()}/>
              <div>
                <h3>{item}</h3>
                <p>{['Optical imagery','AI depth estimation','Metric elevation','3D reconstruction'][i]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="landing-product animate-on-scroll">
        <div>
          <p className="kicker">Scientific precision</p>
          <h2>Measure what the<br/><i>image cannot show.</i></h2>
          <p>Calibrated terrain intelligence for resilient infrastructure, disaster planning and environmental monitoring.</p>
        </div>
        <div className="statboard">
          {[['MIN ELEVATION','42.3 m'],['MAX ELEVATION','187.6 m'],['TOTAL RELIEF','145.3 m'],['CONFIDENCE','91.7%']].map((x,i) => (
            <div key={x[0]} className="animate-on-scroll" style={{transitionDelay: `${i * 100}ms`}}><small>{x[0]}</small><b>{x[1]}</b></div>
          ))}
        </div>
      </section>

      <footer id="about" className="animate-on-scroll">
        <span>© 2026 DEPTHWIZARD</span>
        <span>One image. A navigable world.</span>
      </footer>
    </main>
  );
}
