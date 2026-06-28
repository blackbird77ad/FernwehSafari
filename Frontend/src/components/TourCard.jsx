import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import fallbackTourImage from "../assets/photos/ngorongoro-wide-with-tourists.jpg";
import { createReferral } from "../services/referralService";
import { eur } from "../utils/formatters";

function routeLabel(tour) {
  return [tour.startLocation, tour.routeSummary, tour.endLocation].filter(Boolean).join(" - ") || tour.location;
}

function groupLabel(tour) {
  if (tour.groupSizeMin && tour.groupSizeMax) {
    return `${tour.groupSizeMin}-${tour.groupSizeMax} guests`;
  }

  if (tour.groupSizeMax) {
    return `Up to ${tour.groupSizeMax}`;
  }

  if (tour.groupSizeMin) {
    return `From ${tour.groupSizeMin}`;
  }

  return "";
}

export default function TourCard({ compact = false, tour }) {
  const navigate = useNavigate();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const image = tour.images?.[0] || fallbackTourImage;
  const rating = Number(tour.reviewRating || tour.partner?.rating || 0);
  const reviewCount = Number(tour.reviewCount || tour.partner?.reviewCount || 0);
  const inclusions = tour.inclusions?.slice(0, 2) || [];
  const route = routeLabel(tour);
  const group = groupLabel(tour);
  const itineraryDays = tour.itinerary?.length || tour.durationDays || "";
  const confirmation = tour.confirmationType && tour.confirmationType !== "On request" ? tour.confirmationType : "";

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
    <article className={compact ? "tour-card compact-tour-card" : "tour-card"}>
      <div className="tour-card-image">
        <img src={image} alt={`${tour.title} preview`} loading="lazy" />
        <strong className="tour-price-badge">
          {eur.format(tour.priceEUR)}
          <small>{tour.priceBasis || "Per person"}</small>
        </strong>
        {tour.featured && <span className="tour-featured-badge">Featured</span>}
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
        <div className="tour-card-facts">
          <span>
            <strong>Route</strong>
            {route}
          </span>
          {group && (
            <span>
              <strong>Group</strong>
              {group}
            </span>
          )}
          {itineraryDays && (
            <span>
              <strong>Itinerary</strong>
              {itineraryDays} {Number(itineraryDays) === 1 ? "day" : "days"}
            </span>
          )}
          {confirmation && (
            <span>
              <strong>Confirm</strong>
              {confirmation}
            </span>
          )}
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
            {bookingLoading ? "Starting..." : compact ? "Book" : "Book with Travellex"}
          </button>
          <Link className="button secondary compact" to={compact ? `/tours/${tour.slug}` : `/tours/${tour.slug}#quote`}>
            {compact ? "Details" : "Request quote"}
          </Link>
        </div>
        {bookingMessage && <p className="form-note error">{bookingMessage}</p>}
      </div>
    </article>
  );
}
