import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <p className="eyebrow">Africa-Europe travel referrals</p>
        <h1>FernwehSafari</h1>
        <p>
          Discover Tanzania safari routes, Kilimanjaro views and Zanzibar coast experiences, then enquire and get
          referred to trusted local tour partners.
        </p>
        <div className="button-row">
          <Link className="button primary" to="/tours">
            Browse tours
          </Link>
          <Link className="button secondary light" to="/contact">
            Ask a question
          </Link>
        </div>
      </div>
      <div className="hero-stats">
        <span>
          <strong>EUR</strong>
          Tour pricing
        </span>
        <span>
          <strong>15</strong>
          Key locations
        </span>
        <span>
          <strong>DE</strong>
          Europe-facing
        </span>
      </div>
    </section>
  );
}
