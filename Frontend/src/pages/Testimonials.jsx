import TestimonialCard from "../components/TestimonialCard";
import { testimonials } from "../utils/staticContent";

export default function Testimonials() {
  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">Testimonials</p>
        <h1>Traveller proof for the referral journey.</h1>
      </section>
      <section className="section">
        <div className="card-grid">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
        </div>
      </section>
    </>
  );
}
