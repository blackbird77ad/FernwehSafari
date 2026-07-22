import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import fallbackTourImage from "../assets/photos/ngorongoro-wide-with-tourists.jpg";
import useAuth from "../hooks/useAuth";
import { setPendingBookingPath } from "../utils/bookingIntent";
import { eur } from "../utils/formatters";
import { isVideoMedia, normalizeTourMedia } from "../utils/tourMedia";

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

function compactText(value, fallback = "") {
  return String(value || fallback).trim();
}

function uniqueList(values) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}

export default function TourCard({ compact = false, tour, variant = "default" }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const media = normalizeTourMedia(tour.images);
  const mediaItems = media.length ? media : [fallbackTourImage];
  const hasMediaCarousel = mediaItems.length > 1;
  const [mediaIndex, setMediaIndex] = useState(0);
  const [mediaHovering, setMediaHovering] = useState(false);
  const rating = Number(tour.reviewRating || tour.partner?.rating || 0);
  const reviewCount = Number(tour.reviewCount || tour.partner?.reviewCount || 0);
  const inclusions = tour.inclusions?.slice(0, 2) || [];
  const route = routeLabel(tour);
  const group = groupLabel(tour);
  const itineraryDays = tour.itinerary?.length || tour.durationDays || "";
  const confirmation = tour.confirmationType && tour.confirmationType !== "On request" ? tour.confirmationType : "";
  const summary = tour.shortDescription || tour.routeSummary || tour.description || "A Travellex-approved tour listing from a trusted partner.";
  const location = tour.location || tour.destination || "Destination to confirm";
  const operator = tour.partner?.name || "Approved operator";
  const ratingLabel = rating ? `${rating.toFixed(1)} / 5` : "New";
  const reviewLabel = reviewCount ? `${reviewCount} reviews` : "Travellex reviewed";
  const bestSeller = rating >= 4.7 || reviewCount >= 50;
  const languageLabel = tour.languages?.filter(Boolean).slice(0, 2).join(", ") || (tour.guideIncluded ? "Local guide" : "Optional");
  const mediaLabel = `${mediaItems.length} ${mediaItems.length === 1 ? "media" : "media"}`;
  const isPublicVariant = variant === "catalog" || variant === "market";
  const cardClass = [
    "tour-card",
    compact && "compact-tour-card",
    variant === "catalog" && "public-catalog-card",
    variant === "market" && "public-market-card"
  ]
    .filter(Boolean)
    .join(" ");
  const quickFacts = [
    { label: "Duration", value: tour.duration || (itineraryDays ? `${itineraryDays} days` : "Flexible") },
    { label: "Group size", value: group || "Private option" },
    { label: "Accommodation", value: tour.accommodation || "Arranged by operator" },
    { label: "Transport", value: tour.transport || (tour.pickupIncluded ? "Pickup included" : "Local transfer") },
    { label: "Meals", value: tour.meals || "See details" },
    { label: "Guide", value: languageLabel },
    { label: "Difficulty", value: tour.difficulty || "Easy to moderate" }
  ].filter((item) => item.value);
  const highlightChips = uniqueList([
    tour.comfortLevel,
    tour.tourType,
    tour.category,
    ...(tour.highlights || []),
    ...inclusions
  ]).slice(0, 7);
  const trustItems = uniqueList([
    tour.cancellationPolicy ? "Cancellation terms listed" : "Verified terms",
    "Secure enquiry",
    "Verified tour",
    tour.guideIncluded ? "Guide included" : "Guide optional",
    confirmation || "Operator confirmation"
  ]).slice(0, 5);
  const destinationSummary = [tour.startLocation, tour.endLocation].filter(Boolean).join(" to ") || location;

  useEffect(() => {
    setMediaIndex(0);
    setMediaHovering(false);
  }, [tour._id]);

  useEffect(() => {
    if (!mediaHovering || !hasMediaCarousel) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setMediaIndex((current) => (current + 1) % mediaItems.length);
    }, 1650);

    return () => window.clearInterval(timer);
  }, [hasMediaCarousel, mediaHovering, mediaItems.length]);

  function showPreviousMedia(event) {
    event.preventDefault();
    event.stopPropagation();
    setMediaIndex((current) => (current - 1 + mediaItems.length) % mediaItems.length);
  }

  function showNextMedia(event) {
    event.preventDefault();
    event.stopPropagation();
    setMediaIndex((current) => (current + 1) % mediaItems.length);
  }

  function handleBook() {
    if (!tour?._id) {
      return;
    }

    const bookingPath = `/booking/start/${tour._id}`;

    if (!isAuthenticated) {
      setPendingBookingPath(bookingPath);
      navigate("/login", {
        state: {
          from: bookingPath,
          message: "Sign in or create a free traveller account to continue booking."
        }
      });
      return;
    }

    navigate(bookingPath);
  }

  if (isPublicVariant) {
    const browserFacts = [
      { label: "Destination", value: location },
      { label: "Duration", value: tour.duration || (itineraryDays ? `${itineraryDays} days` : "Flexible") },
      { label: "Group", value: group || tour.tourType || "Private option" }
    ].filter((fact) => fact.value);

    return (
      <article className={`${cardClass} public-browser-card`}>
        <div
          className="tour-card-image luxury-media-frame public-browser-media"
          onMouseEnter={() => setMediaHovering(true)}
          onMouseLeave={() => setMediaHovering(false)}
        >
          <div className="tour-media-track" style={{ transform: `translateX(-${mediaIndex * 100}%)` }}>
            {mediaItems.map((item, index) => (
              <div className="tour-media-slide" key={`${item}-${index}`}>
                {isVideoMedia(item) ? (
                  <video
                    src={item}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    autoPlay={index === mediaIndex && mediaHovering}
                    aria-label={`${tour.title} video preview ${index + 1}`}
                  />
                ) : (
                  <img src={item} alt={`${tour.title} preview ${index + 1}`} loading="lazy" />
                )}
              </div>
            ))}
          </div>
          <Link className="tour-image-link-overlay" to={`/tours/${tour.slug}`} aria-label={`View ${tour.title}`} />
          {hasMediaCarousel && (
            <>
              <div className="tour-media-buttons" aria-label={`${tour.title} media controls`}>
                <button type="button" onClick={showPreviousMedia} aria-label="Previous tour media">
                  <span aria-hidden="true">&lsaquo;</span>
                </button>
                <button type="button" onClick={showNextMedia} aria-label="Next tour media">
                  <span aria-hidden="true">&rsaquo;</span>
                </button>
              </div>
              <div className="tour-media-dots" aria-label={`${mediaItems.length} media items`}>
                {mediaItems.map((item, index) => (
                  <button
                    className={index === mediaIndex ? "active" : ""}
                    key={`${item}-dot`}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setMediaIndex(index);
                    }}
                    aria-label={`Show media ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="tour-card-badge-stack">
            {tour.featured && <span>Featured</span>}
            {bestSeller && <span>Best seller</span>}
            {tour.vrEnabled && <span>VR preview</span>}
          </div>
          <span className="tour-gallery-badge">{mediaLabel}</span>
          <div className="tour-media-bottom-bar">
            <span>{rating ? `${rating.toFixed(1)} rating` : "New tour"}</span>
            <span>{reviewLabel}</span>
          </div>
        </div>

        <div className="card-body public-browser-body">
          <div className="public-listing-kicker public-browser-tags">
            <span>{tour.category || "Tour"}</span>
            {tour.comfortLevel && <span>{tour.comfortLevel}</span>}
          </div>
          <h3>
            <Link className="tour-card-title-link" to={`/tours/${tour.slug}`}>
              {tour.title}
            </Link>
          </h3>
          <p>{compactText(summary, "A curated Travellex partner experience.")}</p>

          <div className="public-browser-facts">
            {browserFacts.map((fact) => (
              <span key={fact.label}>
                <strong>{fact.label}</strong>
                {fact.value}
              </span>
            ))}
          </div>

          <div className="public-browser-footer">
            <div className="public-browser-price">
              <span>From</span>
              <strong>{eur.format(tour.priceEUR)}</strong>
              <small>{tour.priceBasis || "Per person"}</small>
            </div>
            <div className="public-browser-actions">
              <button className="button primary compact" type="button" onClick={handleBook}>
                Book
              </button>
              <Link className="button secondary compact" to={`/tours/${tour.slug}`}>
                Details
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cardClass}>
      <div
        className="tour-card-image luxury-media-frame"
        onMouseEnter={() => setMediaHovering(true)}
        onMouseLeave={() => setMediaHovering(false)}
      >
        <div className="tour-media-track" style={{ transform: `translateX(-${mediaIndex * 100}%)` }}>
          {mediaItems.map((item, index) => (
            <div className="tour-media-slide" key={`${item}-${index}`}>
              {isVideoMedia(item) ? (
                <video
                  src={item}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  autoPlay={index === mediaIndex && mediaHovering}
                  aria-label={`${tour.title} video preview ${index + 1}`}
                />
              ) : (
                <img src={item} alt={`${tour.title} preview ${index + 1}`} loading="lazy" />
              )}
            </div>
          ))}
        </div>
        {hasMediaCarousel && (
          <>
            <div className="tour-media-buttons" aria-label={`${tour.title} media controls`}>
              <button type="button" onClick={showPreviousMedia} aria-label="Previous tour media">
                <span aria-hidden="true">&lsaquo;</span>
              </button>
              <button type="button" onClick={showNextMedia} aria-label="Next tour media">
                <span aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div className="tour-media-dots" aria-label={`${mediaItems.length} media items`}>
              {mediaItems.map((item, index) => (
                <button
                  className={index === mediaIndex ? "active" : ""}
                  key={`${item}-dot`}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setMediaIndex(index);
                  }}
                  aria-label={`Show media ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
        {isPublicVariant && (
          <>
            <div className="tour-card-badge-stack">
              {tour.featured && <span>Featured</span>}
              {bestSeller && <span>Best seller</span>}
              {tour.vrEnabled && <span>VR preview</span>}
            </div>
            <span className="tour-gallery-badge">{mediaLabel}</span>
            <div className="tour-media-bottom-bar">
              <span>{rating ? `${rating.toFixed(1)} rating` : "New tour"}</span>
              <span>{reviewLabel}</span>
            </div>
          </>
        )}
        <strong className="tour-price-badge">
          {eur.format(tour.priceEUR)}
          <small>{tour.priceBasis || "Per person"}</small>
        </strong>
        {tour.featured && <span className="tour-featured-badge">Featured</span>}
        {tour.vrEnabled && <span className="tour-vr-badge">VR</span>}
      </div>
      <div className="card-body public-listing-body">
        <div className="public-listing-main">
          <div className="public-listing-head">
            <div>
              <div className="public-listing-kicker">
                <span>{tour.category || "Tour"}</span>
                {tour.comfortLevel && <span>{tour.comfortLevel}</span>}
                {tour.tourType && <span>{tour.tourType}</span>}
              </div>
              <h3>
                <Link className="tour-card-title-link" to={`/tours/${tour.slug}`}>
                  {tour.title}
                </Link>
              </h3>
              <p>{compactText(summary, "A curated Travellex partner experience.")}</p>
            </div>
          </div>

          <div className="public-destination-summary">
            <span>
              <strong>{destinationSummary}</strong>
              {route && route !== destinationSummary ? route : "Route details available on the tour page"}
            </span>
          </div>

          <div className="public-listing-meta-grid public-quick-info-grid">
            {quickFacts.map((fact) => (
              <span key={fact.label}>
                <strong>{fact.label}</strong>
                {fact.value}
              </span>
            ))}
          </div>

          {highlightChips.length > 0 && (
            <div className="public-highlight-chips">
              {highlightChips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          )}

          <div className="public-listing-operator">
            <span>
              <strong>{operator}</strong>
              <small>Verified partner</small>
            </span>
            <span>
              <strong>{ratingLabel}</strong>
              <small>{reviewLabel}</small>
            </span>
          </div>

          <div className="public-trust-row">
            {trustItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <aside className="public-listing-booking-panel">
          <div className="public-listing-price-card">
            <span>From</span>
            <strong>{eur.format(tour.priceEUR)}</strong>
            <small>{tour.priceBasis || "Per person"}</small>
          </div>
          <div className="button-row public-listing-actions">
            <button className="button primary compact" type="button" onClick={handleBook}>
              {compact ? "Book" : "Book now"}
            </button>
            <Link className="button secondary compact" to={compact ? `/tours/${tour.slug}` : `/tours/${tour.slug}#quote`}>
              {compact ? "Details" : "Explore tour"}
            </Link>
          </div>
          <small className="public-price-note">Final details confirmed by the operator.</small>
        </aside>
      </div>
    </article>
  );
}
