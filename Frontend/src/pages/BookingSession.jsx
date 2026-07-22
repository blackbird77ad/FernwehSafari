import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import Spinner from "../components/Spinner";
import { getBookingOpenURL, getBookingSession } from "../services/referralService";

export default function BookingSession() {
  const { trackingCode } = useParams();
  const location = useLocation();
  const initialSession = location.state?.referral ? { referral: location.state.referral } : null;
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(!initialSession);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const tour = session?.referral?.tour;
  const partner = session?.referral?.partner;
  const bookingTitle = useMemo(() => tour?.title || "your selected tour", [tour?.title]);
  const hasExternalBooking = Boolean(session?.referral?.hasExternalBooking ?? session?.referral?.outboundUrl);
  const bookingOpenURL = trackingCode && hasExternalBooking ? getBookingOpenURL(trackingCode) : "";

  useEffect(() => {
    if (session || !trackingCode) {
      return;
    }

    getBookingSession(trackingCode)
      .then((response) => setSession(response.data))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [session, trackingCode]);

  async function copySupportReference() {
    try {
      await window.navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage("Copy failed. You can still select and copy the support reference manually.");
    }
  }

  if (loading) {
    return (
      <section className="section booking-session-shell">
        <SEO canonicalPath="/booking" noindex title="Booking" />
        <Spinner label="Preparing booking" />
      </section>
    );
  }

  if (!session?.referral) {
    return (
      <section className="section booking-session-shell">
        <SEO canonicalPath="/booking" noindex title="Booking" />
        <div className="booking-session-empty">
          <p className="eyebrow">Booking</p>
          <h1>We could not open this booking.</h1>
          <p>{message || "The booking link may have expired. You can start again from the tour page."}</p>
          <Link className="button primary" to="/tours">
            Browse tours
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-session-page">
      <SEO canonicalPath="/booking" noindex title="Booking" />
      <div className="booking-session-header">
        <div>
          <p className="eyebrow">Booking</p>
          <h1>Continue with {partner?.name || "the tour operator"}.</h1>
          <p>
            You are ready to book {bookingTitle}. We have prepared the right operator link for you.
          </p>
        </div>
        <div className="booking-session-meta" aria-label="Booking session details">
          <span>
            <strong>Tour</strong>
            {tour?.location || "Selected tour"}
          </span>
          <span>
            <strong>Operator</strong>
            {partner?.name || "Approved partner"}
          </span>
          <span>
            <strong>Reference</strong>
            Ready
          </span>
        </div>
      </div>
      {hasExternalBooking ? (
        <div className="booking-handoff-panel">
          <div>
            <p className="eyebrow">Next step</p>
            <h2>Finish your booking with {partner?.name || "the operator"}.</h2>
            <p>
              Complete availability, traveller details and payment on the operator booking page.
            </p>
          </div>
          <details className="booking-reference-details">
            <summary>Support reference</summary>
            <div className="booking-code-box">
              <span>For Travellex support</span>
              <strong>{trackingCode}</strong>
              <small>You only need this if you ask us for help with this booking.</small>
            </div>
          </details>
          <div className="button-row">
            <a className="button primary" href={bookingOpenURL}>
              Continue booking
            </a>
            <button className="button secondary" type="button" onClick={copySupportReference}>
              {copied ? "Copied" : "Copy support reference"}
            </button>
            <Link className="button secondary" to={tour?.slug ? `/tours/${tour.slug}#quote` : "/contact"}>
              Ask a question
            </Link>
          </div>
          {message && <p className="form-note error">{message}</p>}
        </div>
      ) : (
        <div className="booking-internal-panel">
          <p className="eyebrow">Booking request</p>
          <h2>Send your trip details to Travellex.</h2>
          <p>
            This operator does not have instant online booking yet. Share your dates and questions and Travellex will help with the next step.
          </p>
          <div className="booking-session-meta" aria-label="Booking request details">
            <span>
              <strong>Support ref</strong>
              {trackingCode}
            </span>
            <span>
              <strong>Tour</strong>
              {tour?.title || "Selected tour"}
            </span>
            <span>
              <strong>Next step</strong>
              Trip details
            </span>
          </div>
          <div className="button-row">
            <a className="button primary" href={`mailto:experience@travellex.tours?subject=${encodeURIComponent(`Booking ${trackingCode}`)}`}>
              Contact Travellex
            </a>
            <Link className="button secondary" to={tour?.slug ? `/tours/${tour.slug}#quote` : "/contact"}>
              Send trip details
            </Link>
          </div>
        </div>
      )}
      <div className="booking-session-help">
        <p>
          Need help before you continue? Ask Travellex and we will connect the details to this tour.
        </p>
        <Link className="button secondary compact" to={tour?.slug ? `/tours/${tour.slug}` : "/tours"}>
          Back to tour
        </Link>
      </div>
    </section>
  );
}
