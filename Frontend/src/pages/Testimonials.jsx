import { Link } from "react-router-dom";
import TestimonialCard from "../components/TestimonialCard";
import { destinationStories, testimonials } from "../utils/staticContent";

export default function Testimonials() {
  const nungwi = destinationStories.find((story) => story.name === "Nungwi Beach") || destinationStories[0];

  return (
    <>
      <section className="page-hero compact-hero testimonials-hero">
        <p className="eyebrow">Testimonials</p>
        <h1>Traveller stories from Tanzania and Zanzibar routes.</h1>
      </section>
      <section className="section split-panel">
        <div>
          <p className="eyebrow">Traveller proof</p>
          <h2>Stories that help future travellers imagine the route.</h2>
        </div>
        <p className="lead">
          FernwehSafari testimonials focus on the useful details: what helped people compare routes, what felt clear
          before enquiry and which destinations made the journey memorable.
        </p>
      </section>
      <section className="section">
        <div className="card-grid">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
        </div>
      </section>
      <section className="section tinted">
        <div className="section-heading">
          <p className="eyebrow">What travellers mention</p>
          <h2>Small signals that make planning easier.</h2>
        </div>
        <div className="feature-grid">
          <article>
            <h2>Route clarity</h2>
            <p>Travellers want to understand how safari, mountain, city and coast days connect.</p>
          </article>
          <article>
            <h2>Visual confidence</h2>
            <p>Gallery moments, tour images and destination context make the trip feel less abstract.</p>
          </article>
          <article>
            <h2>Next steps</h2>
            <p>Clear enquiry and booking paths reduce the uncertainty between dreaming and committing.</p>
          </article>
        </div>
      </section>
      <section className="section story-band">
        <div className="story-media">
          <img src={nungwi.image} alt="Nungwi beach and Zanzibar island travel scene" />
        </div>
        <div>
          <p className="eyebrow">Share a memory</p>
          <h2>Your picture or video can help the next traveller choose.</h2>
          <p className="lead">
            Submit a travel moment through the gallery. FernwehSafari reviews it first, then approved pictures or
            videos can appear with credit and destination context.
          </p>
          <Link className="button primary" to="/gallery">
            Share media
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="steps-grid">
          <article className="step-card">
            <span>01</span>
            <h3>Send context</h3>
            <p>Include where the moment happened, who should be credited and what travellers should notice.</p>
          </article>
          <article className="step-card">
            <span>02</span>
            <h3>Staff review</h3>
            <p>FernwehSafari checks media before it becomes public in the gallery.</p>
          </article>
          <article className="step-card">
            <span>03</span>
            <h3>Inspire others</h3>
            <p>Approved media adds texture to route pages and travel planning across the site.</p>
          </article>
        </div>
      </section>
    </>
  );
}
