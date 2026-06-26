import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import fallbackTourImage from "../assets/photos/ngorongoro-wide-with-tourists.jpg";
import { createReferral } from "../services/referralService";
import { eur } from "../utils/formatters";

export default function TourCard({ tour }) {
  const navigate = useNavigate();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const image = tour.images?.[0] || fallbackTourImage;
  const rating = Number(tour.reviewRating || tour.partner?.rating || 0);
  const reviewCount = Number(tour.reviewCount || tour.partner?.reviewCount || 0);
  const inclusions = tour.inclusions?.slice(0, 2) || [];

  async function handleBook() {
    if (bookingLoading) {
      return;
    }

    setBookingLoading(true);
    setBookingMessage("");

    try {
      const response = await createReferral({ tourId: tour._id });
      const trackingCode = response.data.referral?.trackingCode;

      if (!trackingCode) {
        throw new Error("Travellex booking tracking could not be created.");
      }

      navigate(`/booking/${trackingCode}`, {
        state: {
          referral: response.data.referral
        }
      });
    } catch (error) {
      setBookingMessage(error.message);
      setBookingLoading(false);
    }
  }

  return (
    <article className="tour-card">
      <div className="tour-card-image">
        <img src={image} alt={`${tour.title} preview`} loading="lazy" />
        <strong className="tour-price-badge">{eur.format(tour.priceEUR)}</strong>
        {tour.vrEnabled && <span className="tour-vr-badge">VR</span>}
      </div>
      <div className="card-body">
        <div className="pill-row">
          <span>{tour.category}</span>
          <span>{tour.duration}</span>
          {tour.comfortLevel && <span>{tour.comfortLevel}</span>}
          {tour.tourType && <span>{tour.tourType}</span>}
        </div>
        <div>
          <h3>
            <Link className="tour-card-title-link" to={`/tours/${tour.slug}`}>
              {tour.title}
            </Link>
          </h3>
          <p>{tour.shortDescription || tour.description}</p>
        </div>
        <div className="tour-operator-row">
          <span>{tour.partner?.name || "Approved operator"}</span>
          <strong>{rating ? `${rating.toFixed(1)} / 5` : "New"}</strong>
          <small>{reviewCount ? `${reviewCount} reviews` : "Operator reviewed by Travellex"}</small>
        </div>
        {(tour.routeSummary || inclusions.length > 0) && (
          <div className="tour-compare-notes">
            {tour.routeSummary && <span>{tour.routeSummary}</span>}
            {inclusions.length > 0 && <span>Includes {inclusions.join(", ")}</span>}
          </div>
        )}
        <div className="card-meta">
          <span>{tour.location}</span>
          <strong>{eur.format(tour.priceEUR)}</strong>
        </div>
        <div className="button-row">
          <button className="button primary compact" type="button" onClick={handleBook} disabled={bookingLoading}>
            {bookingLoading ? "Starting..." : "Book with Travellex"}
          </button>
          <Link className="button secondary compact" to={`/tours/${tour.slug}#quote`}>
            Request quote
          </Link>
        </div>
        {bookingMessage && <p className="form-note error">{bookingMessage}</p>}
      </div>
    </article>
  );
}
