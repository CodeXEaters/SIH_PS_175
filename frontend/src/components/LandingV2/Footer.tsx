export function Footer() {
  return (
    <footer id="footer" className="footer-v2" aria-label="Footer">
      <div className="container">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo-row">
            <span className="footer-brand-name">BHUDARPAN</span>
          </div>
          <span className="footer-brand-tagline">Seeing a deeper Earth.</span>
        </div>

        {/* Center: Essential Navigation */}
        <div className="footer-center">
          <nav aria-label="Footer navigation">
            <ul className="footer-links">
              <li><a href="#transformation">Product</a></li>
              <li><a href="#capabilities">Technology</a></li>
              <li><a href="#impact">Applications</a></li>
              <li><a href="#footer">About</a></li>
            </ul>
          </nav>
        </div>

        {/* Right: Attribution */}
        <div className="footer-right">
          <p className="footer-copy">
            © 2026 Bhudarpan.<br />
            Built for Smart India Hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
}
