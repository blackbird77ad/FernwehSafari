import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DestinationStoryCard from "../components/DestinationStoryCard";
import HeroSection from "../components/HeroSection";
import Spinner from "../components/Spinner";
import StepCard from "../components/StepCard";
import TestimonialCard from "../components/TestimonialCard";
import TourCard from "../components/TourCard";
import { getTours } from "../services/tourService";
import { destinationStories, testimonials } from "../utils/staticContent";

export default function Home() {
  const navigate = useNavigate();
  const [featuredTours, setFeaturedTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const destinationOptions = destinationStories.map((story) => story.name);
  const activityOptions = ["Safari", "Beach", "Mountain", "Cultural", "Combination"];

  useEffect(() => {
    getTours({ featured: true })
      .then((response) => setFeaturedTours(response.data.tours.slice(0, 4)))
      .catch(() => setFeaturedTours([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <HeroSection />
      <section className="instant-filter">
        <div className="instant-filter-inner">
          <label className="field">
            <span>Select Destination</span>
            <select
              defaultValue=""
              onChange={(event) => event.target.value && navigate(`/tours?location=${encodeURIComponent(event.target.value)}`)}
            >
              <option value="">Select Destination</option>
              {destinationOptions.map((destination) => (
                <option key={destination} value={destination}>
                  {destination}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Select Activity</span>
            <select
              defaultValue=""
              onChange={(event) => event.target.value && navigate(`/tours?category=${encodeURIComponent(event.target.value)}`)}
            >
              <option value="">Select Activity</option>
              {activityOptions.map((activity) => (
                <option key={activity} value={activity}>
                  {activity}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="section fast-grid-section">
        <div className="quick-split-grid">
          <Link to="/tours?category=Safari" className="quick-split-card safari">
            <span>🦁</span>
            <strong>Mainland Safaris</strong>
          </Link>
          <Link to="/tours?location=Zanzibar" className="quick-split-card coast">
            <span>🏖️</span>
            <strong>Zanzibar Beaches</strong>
          </Link>
        </div>
      </section>
      <section className="section pt-0">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Referral deals</p>
            <h2>Top routes worth checking first.</h2>
          </div>
          <Link className="button secondary" to="/tours">
            View all deals
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : featuredTours.length ? (
          <div className="deal-feed">
            {featuredTours.slice(0, 3).map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        ) : (
          <p className="empty-state">Referral deals are being prepared.</p>
        )}
      </section>
      <section className="section story-band">
        <div className="story-media">
          <img
            src={destinationStories[9].image}
            alt="Ngorongoro crater safari landscape"
          />
        </div>
        <div>
          <p className="eyebrow">Travel inspiration</p>
          <h2>From volcanic crater mornings to spice-island evenings.</h2>
          <p className="lead">
            FernwehSafari is built for travellers who want the trip to feel vivid before they book: sunrise game
            drives, Kilimanjaro foothills, Stone Town alleys, Jozani forest shade and warm Zanzibar water. You should
            be able to imagine the route before you commit to it.
          </p>
          <div className="button-row">
            <Link className="button primary" to="/gallery">
              See gallery
            </Link>
            <Link className="button secondary" to="/about">
              How we curate
            </Link>
          </div>
        </div>
      </section>
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
          <p className="empty-state">Featured tours are being prepared.</p>
        )}
      </section>
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Choose your travel rhythm</p>
          <h2>Different routes for different kinds of journeys.</h2>
        </div>
        <div className="feature-grid">
          <article>
            <h2>Safari first</h2>
            <p>Focus on Ngorongoro, Lake Manyara, Mikumi and wildlife-rich days with early starts and quiet lodges.</p>
          </article>
          <article>
            <h2>Mountain and culture</h2>
            <p>Pair Kilimanjaro views with village visits, heritage stops and routes that slow down between regions.</p>
          </article>
          <article>
            <h2>Coast finish</h2>
            <p>End with Stone Town, Nungwi, Kendwa, Paje, Jozani Forest or Mnemba-style marine days.</p>
          </article>
        </div>
      </section>
      <section className="section tinted destination-showcase">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Signature places</p>
            <h2>The kind of Tanzania and Zanzibar moments people cross continents for.</h2>
          </div>
          <Link className="button secondary" to="/tours">
            Browse all places
          </Link>
        </div>
        <div className="destination-story-grid featured-grid">
          {destinationStories.slice(0, 8).map((story, index) => (
            <DestinationStoryCard key={story.name} story={story} featured={index === 0} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Find a route, ask your questions and continue when you are ready.</h2>
        </div>
        <div className="steps-grid">
          <StepCard number="01" title="Browse" text="Compare curated routes across Tanzania mainland and Zanzibar." />
          <StepCard number="02" title="Enquire" text="Share your dates, travel style, budget and must-see locations." />
          <StepCard number="03" title="Book" text="Continue to the selected tour booking page when the route feels right." />
        </div>
      </section>
      <section className="section split-panel">
        <div>
          <p className="eyebrow">Travel confidence</p>
          <h2>Clear next steps before you leave Europe.</h2>
          <p className="lead">
            Each tour page gives you the route, price context, duration, highlights and booking path. You can save
            tours, ask questions and compare options before committing.
          </p>
        </div>
        <div className="stat-list">
          <span>
            <strong>01</strong>
            EUR pricing for quick comparison
          </span>
          <span>
            <strong>02</strong>
            Route context before enquiry
          </span>
          <span>
            <strong>03</strong>
            Operator applications reviewed before publishing
          </span>
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
      <section className="section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">For tour companies and guides</p>
            <h2>Good local routes should be easier for European travellers to find.</h2>
          </div>
          <Link className="button secondary" to="/partner">
            Partner with FernwehSafari
          </Link>
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
