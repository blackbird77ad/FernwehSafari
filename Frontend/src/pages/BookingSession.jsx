import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { getBookingFrameURL, getBookingSession } from "../services/referralService";

export default function BookingSession() {
  const { trackingCode } = useParams();
  const location = useLocation();
  const initialSession = location.state?.referral ? { referral: location.state.referral } : null;
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(!initialSession);
  const [message, setMessage] = useState("");
  const tour = session?.referral?.tour;
  const partner = session?.referral?.partner;
  const bookingTitle = useMemo(() => tour?.title || "Travellex booking session", [tour?.title]);
  const bookingFrameURL = trackingCode ? getBookingFrameURL(trackingCode) : "";

  useEffect(() => {
    if (session || !trackingCode) {
      return;
    }

    getBookingSession(trackingCode)
      .then((response) => setSession(response.data))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [session, trackingCode]);

  if (loading) {
    return (
      <section className="section booking-session-shell">
        <Spinner label="Preparing Travellex booking session" />
      </section>
    );
  }

  if (!session?.referral || !bookingFrameURL) {
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
            Your booking stays inside Travellex while the approved operator confirms live availability and payment details.
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
      <div className="booking-frame-shell">
        <iframe
          src={bookingFrameURL}
          title={`${bookingTitle} booking window`}
          loading="eager"
          referrerPolicy="origin"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
        />
      </div>
      <div className="booking-session-help">
        <p>
          If the booking window cannot load, ask Travellex to complete the handoff with the operator using this active tracking session.
        </p>
        <Link className="button secondary compact" to={tour?.slug ? `/tours/${tour.slug}` : "/tours"}>
          Back to tour
        </Link>
      </div>
    </section>
  );
}
