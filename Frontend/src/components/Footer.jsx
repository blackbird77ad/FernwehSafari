import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link className="brand" to="/">
          <span className="brand-mark">FS</span>
          <span>FernwehSafari</span>
        </Link>
        <p>Europe-facing referrals for Tanzania and Zanzibar travel partners.</p>
      </div>
      <div>
        <h3>Explore</h3>
        <Link to="/tours">Tours</Link>
        <Link to="/gallery">Gallery</Link>
        <Link to="/testimonials">Testimonials</Link>
      </div>
      <div>
        <h3>Contact</h3>
        <a href="mailto:msamilashalom@gmail.com">msamilashalom@gmail.com</a>
        <a href="https://wa.me/233501657205" target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <span>Built for European travellers</span>
      </div>
    </footer>
  );
}
