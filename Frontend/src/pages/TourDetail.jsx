import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EnquiryForm from "../components/EnquiryForm";
import ImageGallery from "../components/ImageGallery";
import Spinner from "../components/Spinner";
import fallbackTourImage from "../assets/photos/ngorongoro-wide-with-tourists.jpg";
import useAuth from "../hooks/useAuth";
import { createGuideApplication, createGuideBooking } from "../services/guideService";
import { createReferral } from "../services/referralService";
import { getTour } from "../services/tourService";
import { eur } from "../utils/formatters";
import { destinationStories } from "../utils/staticContent";

export default function TourDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, saveTour, user } = useAuth();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [guideApplicationForm, setGuideApplicationForm] = useState({
    phone: "",
    whatsapp: "",
    location: "",
    languages: "",
    licenseNumber: "",
    certifications: "",
    experienceYears: "",
    regions: "",
    dailyRateEUR: "",
    availabilityNote: "",
    message: ""
  });
  const [guideBookingForms, setGuideBookingForms] = useState({});

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
      window.location.assign(response.data.bookingURL);
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

  function updateGuideApplicationField(field, value) {
    setGuideApplicationForm((current) => ({ ...current, [field]: value }));
  }

  function updateGuideBookingField(guideId, field, value) {
    setGuideBookingForms((current) => ({
      ...current,
      [guideId]: {
        name: user?.name || "",
        email: user?.email || "",
        travelDates: "",
        groupSize: "",
        message: "",
        ...(current[guideId] || {}),
        [field]: value
      }
    }));
  }

  async function handleGuideApplication(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/tours/${slug}` } });
      return;
    }

    try {
      await createGuideApplication({
        ...guideApplicationForm,
        tourId: tour._id
      });
      setMessage("Guide application sent. The tour company reviews first, then FernwehSafari confirms.");
      setGuideApplicationForm({
        phone: "",
        whatsapp: "",
        location: "",
        languages: "",
        licenseNumber: "",
        certifications: "",
        experienceYears: "",
        regions: "",
        dailyRateEUR: "",
        availabilityNote: "",
        message: ""
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleGuideBooking(event, guideId) {
    event.preventDefault();
    const form = guideBookingForms[guideId] || {};

    try {
      await createGuideBooking({
        ...form,
        tourId: tour._id,
        guideId
      });
      setMessage("Guide request sent. The guide and tour company will be notified.");
      setGuideBookingForms((current) => ({ ...current, [guideId]: {} }));
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

  const destinationStory =
    destinationStories.find((story) => tour.location?.toLowerCase().includes(story.name.toLowerCase().split(" ")[0])) ||
    destinationStories.find((story) => story.category === tour.category) ||
    destinationStories[0];
  const heroImage = tour.images?.[0] || destinationStory?.image || fallbackTourImage;
  const compactDescription = (tour.shortDescription || tour.description || destinationStory.description || "")
    .split(" ")
    .slice(0, 46)
    .join(" ");

  return (
    <>
      <section className="detail-hero destination-detail-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div>
          <p className="eyebrow">{tour.category}</p>
          <h1>{tour.title}</h1>
          <p>{destinationStory?.hook || tour.shortDescription}</p>
          <div className="button-row">
            <button className="button primary" type="button" onClick={handleReferral}>
              Continue to booking
            </button>
            <button className="button secondary light" type="button" onClick={handleSave}>
              Save tour
            </button>
          </div>
        </div>
      </section>
      <section className="section detail-layout">
        <article className="detail-main">
          <div className="quick-facts-matrix">
            <span>
              <strong>Best Time</strong>
              {destinationStory?.bestTime || "Jun-Oct"}
            </span>
            <span>
              <strong>Vibe</strong>
              {destinationStory?.vibe || tour.category}
            </span>
            <span>
              <strong>Price Level</strong>
              {destinationStory?.priceLevel || "$$"}
            </span>
            <span>
              <strong>Entry Fee</strong>
              {destinationStory?.entryFee || "Ask operator"}
            </span>
          </div>
          <div className="content-block">
            <p>📍 {compactDescription}</p>
            <p>🧭 Duration: {tour.duration}. Route base: {tour.location}. Listed from {eur.format(tour.priceEUR)}.</p>
          </div>
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
          {tour.approvedGuides?.length > 0 && (
            <>
              <h2>Available tour guides</h2>
              <div className="admin-list">
                {tour.approvedGuides
                  .filter((item) => item.isActive)
                  .map((item) => {
                    const guideId = item.guide?._id || item.guide;
                    const form = guideBookingForms[guideId] || {
                      name: user?.name || "",
                      email: user?.email || "",
                      travelDates: "",
                      groupSize: "",
                      message: ""
                    };

                    return (
                      <article className="side-panel" key={guideId}>
                        <p className="eyebrow">Approved guide</p>
                        <h3>{item.guide?.name || "Tour guide"}</h3>
                        <p>
                          {item.languages?.join(", ") || "Languages not listed"} -{" "}
                          {item.dailyRateEUR ? `${eur.format(item.dailyRateEUR)} per day` : "Rate on request"}
                        </p>
                        {item.availabilityNote && <p>{item.availabilityNote}</p>}
                        <form className="panel-form" onSubmit={(event) => handleGuideBooking(event, guideId)}>
                          <div className="form-grid">
                            <label className="field">
                              <span>Name</span>
                              <input value={form.name} onChange={(event) => updateGuideBookingField(guideId, "name", event.target.value)} required />
                            </label>
                            <label className="field">
                              <span>Email</span>
                              <input
                                type="email"
                                value={form.email}
                                onChange={(event) => updateGuideBookingField(guideId, "email", event.target.value)}
                                required
                              />
                            </label>
                          </div>
                          <div className="form-grid">
                            <label className="field">
                              <span>Travel dates</span>
                              <input
                                value={form.travelDates}
                                onChange={(event) => updateGuideBookingField(guideId, "travelDates", event.target.value)}
                              />
                            </label>
                            <label className="field">
                              <span>Group size</span>
                              <input
                                value={form.groupSize}
                                onChange={(event) => updateGuideBookingField(guideId, "groupSize", event.target.value)}
                              />
                            </label>
                          </div>
                          <label className="field">
                            <span>Message</span>
                            <textarea
                              value={form.message}
                              onChange={(event) => updateGuideBookingField(guideId, "message", event.target.value)}
                              rows="3"
                            />
                          </label>
                          <button className="button secondary" type="submit">
                            Request this guide
                          </button>
                        </form>
                      </article>
                    );
                  })}
              </div>
            </>
          )}
        </article>
        <aside className="detail-side">
          <div className="side-panel">
            <p className="eyebrow">Tour operator</p>
            <h2>{tour.partner?.name}</h2>
            <p>{tour.partner?.description}</p>
            <span>{tour.partner?.location}</span>
          </div>
          <div className="side-panel">
            <p className="eyebrow">Enquire</p>
            <EnquiryForm tour={tour} />
          </div>
          {user?.role === "tour_guide" && (
            <div className="side-panel">
              <p className="eyebrow">Tour guide application</p>
              <h2>Apply to guide this tour</h2>
              <form className="panel-form" onSubmit={handleGuideApplication}>
                <div className="form-grid">
                  <label className="field">
                    <span>Phone</span>
                    <input value={guideApplicationForm.phone} onChange={(event) => updateGuideApplicationField("phone", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>WhatsApp</span>
                    <input
                      value={guideApplicationForm.whatsapp}
                      onChange={(event) => updateGuideApplicationField("whatsapp", event.target.value)}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Location</span>
                  <input value={guideApplicationForm.location} onChange={(event) => updateGuideApplicationField("location", event.target.value)} />
                </label>
                <label className="field">
                  <span>Languages</span>
                  <input
                    value={guideApplicationForm.languages}
                    onChange={(event) => updateGuideApplicationField("languages", event.target.value)}
                    placeholder="English, German, Swahili..."
                  />
                </label>
                <div className="form-grid">
                  <label className="field">
                    <span>Licence number</span>
                    <input
                      value={guideApplicationForm.licenseNumber}
                      onChange={(event) => updateGuideApplicationField("licenseNumber", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Years experience</span>
                    <input
                      value={guideApplicationForm.experienceYears}
                      onChange={(event) => updateGuideApplicationField("experienceYears", event.target.value)}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Certifications</span>
                  <input
                    value={guideApplicationForm.certifications}
                    onChange={(event) => updateGuideApplicationField("certifications", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Regions covered</span>
                  <input value={guideApplicationForm.regions} onChange={(event) => updateGuideApplicationField("regions", event.target.value)} />
                </label>
                <label className="field">
                  <span>Daily rate EUR</span>
                  <input
                    type="number"
                    min="0"
                    value={guideApplicationForm.dailyRateEUR}
                    onChange={(event) => updateGuideApplicationField("dailyRateEUR", event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>Availability note</span>
                  <input
                    value={guideApplicationForm.availabilityNote}
                    onChange={(event) => updateGuideApplicationField("availabilityNote", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Message</span>
                  <textarea
                    value={guideApplicationForm.message}
                    onChange={(event) => updateGuideApplicationField("message", event.target.value)}
                    rows="4"
                  />
                </label>
                <button className="button primary" type="submit">
                  Apply as guide
                </button>
              </form>
            </div>
          )}
          {message && <p className="form-note">{message}</p>}
        </aside>
      </section>
      <div className="sticky-booking-bar">
        <span>
          <strong>{tour.title}</strong>
          <small>{eur.format(tour.priceEUR)} · referral booking link</small>
        </span>
        <button className="button primary compact" type="button" onClick={handleReferral}>
          Book real tour
        </button>
      </div>
    </>
  );
}
