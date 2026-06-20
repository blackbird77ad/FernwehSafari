import { Link } from "react-router-dom";

export default function DestinationCard({ destination }) {
  return (
    <Link className="destination-card" to={destination.link}>
      <img src={destination.image} alt={destination.name} loading="lazy" />
      <span>{destination.name}</span>
    </Link>
  );
}
