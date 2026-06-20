import { Link } from "react-router-dom";
import { eur } from "../utils/formatters";

export default function TourCard({ tour }) {
  const image = tour.images?.[0] || "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=80";

  return (
    <article className="tour-card">
      <img src={image} alt={`${tour.title} preview`} loading="lazy" />
      <div className="card-body">
        <div className="pill-row">
          <span>{tour.category}</span>
          <span>{tour.duration}</span>
        </div>
        <div>
          <h3>{tour.title}</h3>
          <p>{tour.shortDescription || tour.description}</p>
        </div>
        <div className="card-meta">
          <span>{tour.location}</span>
          <strong>{eur.format(tour.priceEUR)}</strong>
        </div>
        <Link className="button compact" to={`/tours/${tour.slug}`}>
          View tour
        </Link>
      </div>
    </article>
  );
}
