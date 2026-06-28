import { Link } from "react-router-dom";
import heroImage from "../assets/photos/ngorongoro-wide-with-tourists.jpg";

export default function HeroSection() {
  return (
    <section className="fast-hero home-hero-bg" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="hero-slide-overlay" />
      <div className="fast-hero-content-wrap">
        <div className="fast-hero-content">
          <p className="eyebrow">Africa tours marketplace</p>
          <h1>Book Africa tours with Travellex.</h1>
          <p className="fast-hero-copy">
            Compare safari, mountain, culture and coast journeys from trusted operators, then carry a Travellex booking code through the handoff.
          </p>
          <div className="fast-hero-actions">
            <Link className="button primary" to="/tours">
              Browse tours
            </Link>
            <Link className="button secondary light" to="/virtual-tour">
              Preview in 360
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
