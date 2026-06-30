import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
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
  const bookingTitle = useMemo(() => tour?.title || "Travellex booking session", [tour?.title]);
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

  async function copyTrackingCode() {
    try {
      await window.navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage("Copy failed. You can still select and copy the booking code manually.");
    }
  }

  if (loading) {
    return (
      <section className="section booking-session-shell">
        <Spinner label="Preparing Travellex booking session" />
      </section>
    );
  }

  if (!session?.referral) {
    return (
      <section className="section booking-session-shell">
        <div className="booking-session-empty">
          <p className="eyebrow">Booking session</p>
          <h1>We could not open this Travellex booking session.</h1>
          <p>{message || "The session may have expired or the tracking code is invalid."}</p>
          <Link className="button primary" to="/tours">
            Browse tours
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-session-page">
      <div className="booking-session-header">
        <div>
          <p className="eyebrow">Travellex booking session</p>
          <h1>{bookingTitle}</h1>
          <p>
            Travellex has created your booking code. Continue on the partner website in a normal browser tab so security checks can work properly.
          </p>
        </div>
        <div className="booking-session-meta" aria-label="Booking session details">
          <span>
            <strong>Hosted by</strong>
            Travellex
          </span>
          <span>
            <strong>Operator</strong>
            {partner?.name || "Approved partner"}
          </span>
          <span>
            <strong>Tracking</strong>
            Active
          </span>
        </div>
      </div>
      {hasExternalBooking ? (
        <div className="booking-handoff-panel">
          <div>
            <p className="eyebrow">Partner booking handoff</p>
            <h2>Open the partner booking page in a new tab.</h2>
            <p>
              Some partner websites use security pages that ask visitors to confirm they are not a robot. Opening the booking page
              outside an embedded window prevents those checks from looping or getting stuck.
            </p>
          </div>
          <div className="booking-code-box">
            <span>Travellex booking code</span>
            <strong>{trackingCode}</strong>
            <small>Keep this code with the booking so Travellex can track support and commission.</small>
          </div>
          <div className="button-row">
            <a className="button primary" href={bookingOpenURL} target="_blank" rel="noopener noreferrer">
              Open partner booking
            </a>
            <button className="button secondary" type="button" onClick={copyTrackingCode}>
              {copied ? "Copied" : "Copy booking code"}
            </button>
            <Link className="button secondary" to={tour?.slug ? `/tours/${tour.slug}#quote` : "/contact"}>
              Ask Travellex to help
            </Link>
          </div>
          {message && <p className="form-note error">{message}</p>}
        </div>
      ) : (
        <div className="booking-internal-panel">
          <p className="eyebrow">Travellex-hosted booking</p>
          <h2>This partner manages the booking through Travellex.</h2>
          <p>
            Your tracking session is active. Travellex will coordinate availability, operator details and payment next
            steps with {partner?.name || "the approved partner"}.
          </p>
          <div className="booking-session-meta" aria-label="Travellex booking handoff">
            <span>
              <strong>Tracking code</strong>
              {trackingCode}
            </span>
            <span>
              <strong>Tour</strong>
              {tour?.title || "Selected tour"}
            </span>
            <span>
              <strong>Next step</strong>
              Travellex handoff
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
          If the partner page asks for a robot check, complete it in the new tab. If it keeps looping, send the booking code to Travellex and we will help complete the handoff.
        </p>
        <Link className="button secondary compact" to={tour?.slug ? `/tours/${tour.slug}` : "/tours"}>
          Back to tour
        </Link>
      </div>
    </section>
  );
}
