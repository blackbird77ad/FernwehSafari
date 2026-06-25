import { Link } from "react-router-dom";
import fallbackTourImage from "../assets/photos/ngorongoro-wide-with-tourists.jpg";
import { eur } from "../utils/formatters";

export default function TourCard({ tour }) {
  const image = tour.images?.[0] || fallbackTourImage;

  return (
    <article className="tour-card">
      <div className="tour-card-image">
        <img src={image} alt={`${tour.title} preview`} loading="lazy" />
        <strong className="tour-price-badge">
          {eur.format(tour.priceEUR)}
        </strong>
        {tour.vrEnabled && <span className="tour-vr-badge">VR</span>}
      </div>
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
        <Link className="button secondary compact" to={`/tours/${tour.slug}`}>
          View tour
        </Link>
      </div>
    </article>
  );
}
