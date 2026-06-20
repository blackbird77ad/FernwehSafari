import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EnquiryForm from "../components/EnquiryForm";
import ImageGallery from "../components/ImageGallery";
import Spinner from "../components/Spinner";
import useAuth from "../hooks/useAuth";
import { createReferral } from "../services/referralService";
import { getTour } from "../services/tourService";
import { eur } from "../utils/formatters";

export default function TourDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, saveTour } = useAuth();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getTour(slug)
      .then((response) => setTour(response.data.tour))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleReferral() {
    if (!tour) {
      return;
    }

    try {
      const response = await createReferral({ tourId: tour._id });
      window.open(response.data.bookingURL, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSave() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/tours/${slug}` } });
      return;
    }

    try {
      await saveTour(tour._id);
      setMessage("Tour saved to your dashboard.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return <Spinner />;
  }

  if (!tour) {
    return (
      <section className="section">
        <p className="empty-state">{message || "Tour not found."}</p>
        <Link className="button secondary" to="/tours">
          Back to tours
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="detail-hero" style={{ backgroundImage: `url(${tour.images?.[0] || ""})` }}>
        <div>
          <p className="eyebrow">{tour.category}</p>
          <h1>{tour.title}</h1>
          <p>{tour.shortDescription}</p>
          <div className="button-row">
            <button className="button primary" type="button" onClick={handleReferral}>
              Book with partner
            </button>
            <button className="button secondary light" type="button" onClick={handleSave}>
              Save tour
            </button>
          </div>
        </div>
      </section>
      <section className="section detail-layout">
        <article className="detail-main">
          <div className="tour-facts">
            <span>{tour.location}</span>
            <span>{tour.duration}</span>
            <strong>{eur.format(tour.priceEUR)}</strong>
          </div>
          <p className="lead">{tour.description}</p>
          <ImageGallery images={tour.images} />
          <h2>Highlights</h2>
          <ul className="check-list">
            {tour.highlights?.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <h2>Itinerary</h2>
          <div className="timeline">
            {tour.itinerary?.map((item) => (
              <article key={`${item.day}-${item.title}`}>
                <span>Day {item.day}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </article>
        <aside className="detail-side">
          <div className="side-panel">
            <p className="eyebrow">Tour partner</p>
            <h2>{tour.partner?.name}</h2>
            <p>{tour.partner?.description}</p>
            <span>{tour.partner?.location}</span>
          </div>
          <div className="side-panel">
            <p className="eyebrow">Enquire</p>
            <EnquiryForm tour={tour} />
          </div>
          {message && <p className="form-note">{message}</p>}
        </aside>
      </section>
    </>
  );
}
