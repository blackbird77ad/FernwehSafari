import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <p className="eyebrow">Tanzania & Zanzibar tours</p>
        <h1>FernwehSafari</h1>
        <p>
          Discover safari routes, Kilimanjaro views, Stone Town culture and Zanzibar coast experiences shaped for
          travellers planning from Europe.
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
          Europe-ready
        </span>
      </div>
    </section>
  );
}
