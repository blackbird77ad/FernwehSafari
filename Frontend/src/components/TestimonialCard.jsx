import { initials } from "../utils/formatters";

export default function TestimonialCard({ testimonial }) {
  return (
    <article className="testimonial-card">
      <div className="avatar">{initials(testimonial.name)}</div>
      <div>
        <div className="rating" aria-label={`${testimonial.rating} star rating`}>
          {"★".repeat(testimonial.rating)}
        </div>
        <p>“{testimonial.quote}”</p>
        <strong>{testimonial.name}</strong>
        <span>
          {testimonial.country} · {testimonial.tour}
        </span>
      </div>
    </article>
  );
}
