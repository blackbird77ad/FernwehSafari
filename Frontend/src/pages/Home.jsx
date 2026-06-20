import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DestinationCard from "../components/DestinationCard";
import HeroSection from "../components/HeroSection";
import Spinner from "../components/Spinner";
import StepCard from "../components/StepCard";
import TestimonialCard from "../components/TestimonialCard";
import TourCard from "../components/TourCard";
import { getTours } from "../services/tourService";
import { destinations, testimonials } from "../utils/staticContent";

export default function Home() {
  const [featuredTours, setFeaturedTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTours({ featured: true })
      .then((response) => setFeaturedTours(response.data.tours.slice(0, 4)))
      .catch(() => setFeaturedTours([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <HeroSection />
      <section className="section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Featured tours</p>
            <h2>Start with Tanzania and Zanzibar routes travellers ask for most.</h2>
          </div>
          <Link className="button secondary" to="/tours">
            View all tours
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : featuredTours.length ? (
          <div className="card-grid tours-grid">
            {featuredTours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        ) : (
          <p className="empty-state">No featured tours yet. Seed the backend database to populate this section.</p>
        )}
      </section>
      <section className="section tinted">
        <div className="section-heading">
          <p className="eyebrow">Client destination set</p>
          <h2>Safari, mountain, coast, forest and heritage stops organised for quick discovery.</h2>
        </div>
        <div className="card-grid destination-grid">
          {destinations.map((destination) => (
            <DestinationCard key={destination.name} destination={destination} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>A referral flow that keeps the booking with the operating partner.</h2>
        </div>
        <div className="steps-grid">
          <StepCard number="01" title="Browse" text="Compare curated routes across Tanzania mainland and Zanzibar." />
          <StepCard number="02" title="Enquire" text="Share your dates, travel style, budget and must-see locations." />
          <StepCard number="03" title="Get referred" text="FernwehSafari connects you to the right local partner booking flow." />
        </div>
      </section>
      <section className="section muted-band">
        <div className="section-heading">
          <p className="eyebrow">Testimonials</p>
          <h2>Proof for European travellers who want local expertise and clear next steps.</h2>
        </div>
        <div className="card-grid">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
        </div>
      </section>
      <section className="cta-band">
        <h2>Ready to compare safari, Kilimanjaro and Zanzibar options?</h2>
        <Link className="button primary" to="/tours">
          Explore tours
        </Link>
      </section>
    </>
  );
}
