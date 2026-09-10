export function FinalCTA({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="cta-section" aria-label="Call to action">
      {/* Quiet cinematic mountain background */}
      <div className="cta-bg" aria-hidden="true">
        <img
          src="/assets/mountain-sunrise.jpg"
          alt=""
          loading="lazy"
        />
      </div>

      <div className="container">
        <h2 className="cta-left reveal">
          A CLEARER PERSPECTIVE<br />
          FOR A BRIGHTER TOMORROW.
        </h2>

        <div className="cta-right reveal reveal-d2">
          <p className="cta-question">Ready to see the unseen?</p>
          <button
            id="cta-get-started-btn"
            className="btn-primary"
            onClick={onEnter}
            aria-label="Get started with Bhudarpan"
          >
            Get Started →
          </button>
        </div>
      </div>
    </section>
  );
}
