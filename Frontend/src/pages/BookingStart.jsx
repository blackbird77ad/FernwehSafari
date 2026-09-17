import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import Spinner from "../components/Spinner";
import { createReferral } from "../services/referralService";

export default function BookingStart() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const [error, setError] = useState("");
  const [tourTitle, setTourTitle] = useState("your tour");

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
          <h1>Sending your request to Travellex.</h1>
          <p>
            We are preparing {tourTitle} for admin review so Travellex can coordinate availability, quote details and next steps.
          </p>
        </div>
        <Spinner label="Preparing request" />
      </div>
    </section>
  );
}
