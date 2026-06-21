import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link className="brand" to="/">
          <span className="brand-mark">FS</span>
          <span>
            FernwehSafari
            <small>Tanzania & Zanzibar travel discovery</small>
          </span>
        </Link>
        <p>
          Curated safari, Kilimanjaro, culture and coast routes for travellers planning from Europe.
        </p>
        <div className="footer-badges">
          <span>EUR pricing</span>
          <span>Europe-ready</span>
          <span>Operator reviewed</span>
        </div>
      </div>
      <div>
        <h3>Explore</h3>
        <Link to="/">Home</Link>
        <Link to="/tours">Tours</Link>
        <Link to="/gallery">Gallery</Link>
        <Link to="/testimonials">Testimonials</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <div>
        <h3>Destinations</h3>
        <Link to="/tours?location=Ngorongoro">Ngorongoro</Link>
        <Link to="/tours?location=Kilimanjaro">Kilimanjaro</Link>
        <Link to="/tours?location=Stone Town">Stone Town</Link>
        <Link to="/tours?location=Nungwi">Zanzibar coast</Link>
      </div>
      <div>
        <h3>Partners</h3>
        <Link to="/partner">Partner</Link>
        <Link to="/login">Login as partner</Link>
        <Link to="/partner#partner-application">Become a partner</Link>
        <Link to="/dashboard">Tour dashboard</Link>
      </div>
      <div>
        <h3>Contact</h3>
        <a href="mailto:msamilashalom@gmail.com">
          <span aria-hidden="true">📧</span>
          msamilashalom@gmail.com
        </a>
        <a href="https://wa.me/4917676062927" target="_blank" rel="noreferrer">
          <span aria-hidden="true">💬</span>
          WhatsApp: +49 176 7606 2927
        </a>
        <a href="https://www.instagram.com/officialshalom2" target="_blank" rel="noreferrer">
          <span aria-hidden="true">📸</span>
          Instagram
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} FernwehSafari. All rights reserved.</span>
        <a href="https://thebrandhelper.com" target="_blank" rel="noreferrer">
          Built by thebrandhelper.com
        </a>
      </div>
    </footer>
  );
}
