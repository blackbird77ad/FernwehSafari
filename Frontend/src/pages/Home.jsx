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
import { activityOptions, destinationOptions, tourSortOptions } from "../utils/travelOptions";

export default function Home() {
  const navigate = useNavigate();
  const [featuredTours, setFeaturedTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState({ search: "", location: "", category: "", sort: "featured" });
  const activeQuickFilterCount = Object.entries(quickSearch).filter(
    ([key, value]) => value && !(key === "sort" && value === "featured")
  ).length;

  useEffect(() => {
    getTours({ featured: true })
      .then((response) => setFeaturedTours(response.data.tours.slice(0, 4)))
      .catch(() => setFeaturedTours([]))
      .finally(() => setLoading(false));
  }, []);

  function updateQuickSearch(field, value) {
    setQuickSearch((current) => ({ ...current, [field]: value }));
  }

  function handleQuickSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();

    Object.entries(quickSearch).forEach(([key, value]) => {
      if (value && !(key === "sort" && value === "featured")) {
        params.set(key, value);
      }
    });

    navigate(`/tours${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <>
      <HeroSection />
      <section className={quickSearchOpen ? "instant-filter open" : "instant-filter collapsed"}>
        <div className="instant-filter-bar">
          <button
            className="instant-filter-toggle"
            type="button"
            onClick={() => setQuickSearchOpen((value) => !value)}
            aria-controls="home-trip-search"
            aria-expanded={quickSearchOpen}
          >
            {quickSearchOpen ? <MinusIcon /> : <SearchIcon />}
            <span>Trip search</span>
          </button>
          <span className="instant-filter-summary">
            {activeQuickFilterCount ? `${activeQuickFilterCount} filter${activeQuickFilterCount === 1 ? "" : "s"} ready` : "Safari, coast, culture"}
          </span>
        </div>
        {quickSearchOpen && (
          <form className="instant-filter-inner search-filter-grid" id="home-trip-search" onSubmit={handleQuickSearch}>
            <label className="field wide">
              <span>Search Africa tours</span>
              <input
                type="search"
                value={quickSearch.search}
                onChange={(event) => updateQuickSearch("search", event.target.value)}
                placeholder="Safari, coast, culture, city, country or route"
              />
            </label>
            <label className="field">
              <span>Destination</span>
              <input
                list="home-destination-options"
                value={quickSearch.location}
                onChange={(event) => updateQuickSearch("location", event.target.value)}
                placeholder="Any destination"
              />
              <datalist id="home-destination-options">
                {destinationOptions.map((destination) => (
                  <option key={destination} value={destination} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>Activity</span>
              <select value={quickSearch.category} onChange={(event) => updateQuickSearch("category", event.target.value)}>
                <option value="">Any activity</option>
                {activityOptions.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Sort</span>
              <select value={quickSearch.sort} onChange={(event) => updateQuickSearch("sort", event.target.value)}>
                {tourSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="button primary" type="submit">
              Explore
            </button>
          </form>
        )}
      </section>
      <section className="section featured-after-search">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Featured tours</p>
            <h2>Admin-featured listings from approved partners.</h2>
          </div>
          <Link className="button secondary" to="/tours?sort=featured">
            View all tours
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
          <p className="empty-state">Featured tours are being prepared.</p>
        )}
      </section>
      <section className="section fast-grid-section">
        <div className="quick-split-grid">
          <Link to="/tours?category=Safari" className="quick-split-card safari">
            <span>🦁</span>
            <strong>Africa Safaris</strong>
          </Link>
          <Link to="/tours?category=Beach" className="quick-split-card coast">
            <span>🏖️</span>
            <strong>Island & Coast</strong>
          </Link>
        </div>
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
          <h2>From African safari mornings to spice-island evenings.</h2>
          <p className="lead">
            Travellex is built for travellers who want the trip to feel vivid before they book: sunrise game
            drives, mountain air, heritage streets, forest shade and warm Indian Ocean water. Tanzania and Zanzibar
            are the current core, but the platform is designed for wider Africa travel.
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
            <p className="eyebrow">Hosted tour listings</p>
            <h2>Start with strong Africa routes, with Tanzania and Zanzibar ready first.</h2>
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
            <h2>The kind of Africa travel moments people cross continents for.</h2>
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
          <StepCard number="01" title="Browse" text="Compare curated Africa routes, starting with Tanzania mainland and Zanzibar." />
          <StepCard number="02" title="Enquire" text="Share your dates, travel style, budget and must-see locations." />
          <StepCard number="03" title="Book" text="Continue to the selected tour booking page when the route feels right." />
        </div>
      </section>
      <section className="section split-panel">
        <div>
          <p className="eyebrow">Travel confidence</p>
          <h2>Clear next steps before you travel.</h2>
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
          <h2>Proof for travellers who want local expertise and clear next steps.</h2>
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
            <h2>Good local Africa routes should be easier for travellers to find.</h2>
          </div>
          <Link className="button secondary" to="/partner">
            Partner with Travellex
          </Link>
        </div>
      </section>
      <section className="cta-band">
        <h2>Ready to compare Africa adventure, safari and coast options?</h2>
        <Link className="button primary" to="/tours">
          Explore tours
        </Link>
      </section>
    </>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}
