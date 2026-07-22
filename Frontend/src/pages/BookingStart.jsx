import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import Spinner from "../components/Spinner";
import { createReferral, getBookingOpenURL } from "../services/referralService";

export default function BookingStart() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const [error, setError] = useState("");
  const [bookingURL, setBookingURL] = useState("");
  const [tourTitle, setTourTitle] = useState("your tour");
  const [partnerName, setPartnerName] = useState("the tour operator");

  useEffect(() => {
    if (startedRef.current || !tourId) {
      return;
    }

    startedRef.current = true;

    createReferral({ tourId })
      .then((response) => {
        const referral = response.data.referral;
        const trackingCode = referral?.trackingCode;

        if (!trackingCode) {
          throw new Error("We could not prepare this booking. Please try again.");
        }

        setTourTitle(referral.tour?.title || "your tour");
        setPartnerName(referral.partner?.name || "the tour operator");

        if (referral.outboundUrl) {
          const nextURL = getBookingOpenURL(trackingCode);
          setBookingURL(nextURL);
          window.setTimeout(() => {
            window.location.assign(nextURL);
          }, 450);
          return;
        }

        navigate(`/booking/${trackingCode}`, {
          replace: true,
          state: {
            referral
          }
        });
      })
      .catch((requestError) => {
        setError(requestError.message);
      });
  }, [navigate, tourId]);

  if (error) {
    return (
      <section className="booking-session-page">
        <SEO canonicalPath="/booking/start" noindex title="Start Booking" />
        <div className="booking-session-empty">
          <p className="eyebrow">Booking</p>
          <h1>We could not start this booking.</h1>
          <p>{error}</p>
          <div className="button-row">
            <Link className="button primary" to="/tours">
              Browse tours
            </Link>
            <Link className="button secondary" to="/contact">
              Contact Travellex
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-session-page">
      <SEO canonicalPath="/booking/start" noindex title="Start Booking" />
      <div className="booking-session-header booking-start-panel">
        <div>
          <p className="eyebrow">Booking</p>
          <h1>Opening {partnerName}.</h1>
          <p>
            We are preparing {tourTitle} and taking you to the operator booking page.
          </p>
        </div>
        <Spinner label="Opening booking" />
      </div>
      {bookingURL && (
        <div className="booking-session-help">
          <p>If the page does not open, continue with the button below.</p>
          <a className="button primary compact" href={bookingURL}>
            Continue booking
          </a>
        </div>
      )}
    </section>
  );
}
