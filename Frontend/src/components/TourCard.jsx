import { Link } from "react-router-dom";
import fallbackTourImage from "../assets/photos/ngorongoro-wide-with-tourists.jpg";
import { eur } from "../utils/formatters";

export default function TourCard({ tour }) {
  const image = tour.images?.[0] || fallbackTourImage;

  return (
    <article className="tour-card relative overflow-hidden">
      <div className="relative">
        <img src={image} alt={`${tour.title} preview`} loading="lazy" />
        <strong className="absolute right-3 top-3 rounded-full bg-fernweh-gold px-3 py-1 text-sm font-black text-fernweh-deep shadow">
          {eur.format(tour.priceEUR)}
        </strong>
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
        <Link className="button compact" to={`/tours/${tour.slug}`}>
          View deal
        </Link>
      </div>
    </article>
  );
}
