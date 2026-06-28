import { Suspense, lazy, useEffect, useState } from "react";
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

const VirtualTourCanvas = lazy(() => import("../components/VirtualTourCanvas"));

function formatGroupSize(tour) {
  if (tour.groupSizeMin && tour.groupSizeMax) {
    return `${tour.groupSizeMin}-${tour.groupSizeMax} guests`;
  }

  if (tour.groupSizeMin) {
    return `From ${tour.groupSizeMin} guests`;
  }

  if (tour.groupSizeMax) {
    return `Up to ${tour.groupSizeMax} guests`;
  }

  return "";
}

function formatOptionalMoney(value) {
  if (value === 0 || value) {
    return eur.format(value);
  }

  return "";
}

export default function TourDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser, saveTour, user } = useAuth();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [guideApplicationForm, setGuideApplicationForm] = useState({
    guideName: "",
    email: "",
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
    if (!tour || bookingLoading) {
      return;
    }

    setBookingLoading(true);

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
      setMessage(error.message);
      setBookingLoading(false);
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

    try {
      await createGuideApplication({
        ...guideApplicationForm,
        tourId: tour._id
      });
      if (isAuthenticated) {
        await refreshUser();
      }
      setMessage(
        isAuthenticated
          ? "Guide application sent. The tour company reviews first, then Travellex confirms."
          : "Guide application sent. If Travellex approves you, we will email a password setup link."
      );
      setGuideApplicationForm({
        guideName: "",
        email: "",
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
  const vrScene =
    tour.vrEnabled && tour.vrMediaUrl
      ? {
          name: tour.title,
          location: tour.location,
          mood: tour.vrCaption || tour.shortDescription || "Admin-approved immersive preview.",
          mediaType: tour.vrMediaType || "image",
          mediaUrl: tour.vrMediaUrl,
          image: tour.vrMediaUrl
        }
      : null;
  const rating = Number(tour.reviewRating || tour.partner?.rating || 0);
  const reviewCount = Number(tour.reviewCount || tour.partner?.reviewCount || 0);
  const routePoints = [tour.startLocation, tour.routeSummary, tour.endLocation].filter(Boolean);
  const groupSize = formatGroupSize(tour);
  const languages = tour.languages?.filter(Boolean).join(", ");
  const ageMinimum = tour.minimumAge === 0 ? "All ages" : tour.minimumAge ? `${tour.minimumAge}+` : "";
  const timeWindow = [tour.departureTime, tour.returnTime].filter(Boolean).join(" - ");
  const availableWeekdays = tour.availableWeekdays?.filter(Boolean).join(", ");
  const depositText = tour.depositPercent === 0 || tour.depositPercent ? `${tour.depositPercent}%` : "";
  const bookingCutoffText =
    tour.bookingCutoffDays === 0
      ? "Same-day booking"
      : tour.bookingCutoffDays
        ? `${tour.bookingCutoffDays} days before start`
        : "";
  const pickupText =
    tour.pickupIncluded || tour.pickupDetails
      ? tour.pickupIncluded
        ? tour.pickupDetails || "Included"
        : tour.pickupDetails || "Not included"
      : "";
  const comparisonItems = [
    { label: "Company", value: tour.partner?.name || "Approved operator" },
    { label: "Comfort", value: tour.comfortLevel || "Ask operator" },
    { label: "Tour type", value: tour.tourType || "Private or shared" },
    { label: "Route", value: routePoints.length ? routePoints.join(" - ") : tour.location },
    { label: "Price basis", value: tour.priceBasis },
    { label: "Group size", value: groupSize },
    { label: "Languages", value: languages },
    { label: "Minimum age", value: ageMinimum },
    { label: "Timing", value: timeWindow },
    { label: "Guide included", value: tour.guideIncluded === false ? "No" : "Yes" },
    { label: "Customizable", value: tour.customizable === false ? "No" : "Yes" }
  ].filter((item) => item.value);
  const logisticsItems = [
    { label: "Meeting point", value: tour.meetingPoint },
    { label: "Pickup", value: pickupText },
    { label: "Difficulty", value: tour.difficulty },
    { label: "Accessibility", value: tour.accessibility },
    { label: "Transport", value: tour.transport },
    { label: "Accommodation", value: tour.accommodation },
    { label: "Meals", value: tour.meals }
  ].filter((item) => item.value);
  const policyItems = [
    { label: "Confirmation", value: tour.confirmationType },
    { label: "Available days", value: availableWeekdays },
    { label: "Child price", value: formatOptionalMoney(tour.childPriceEUR) },
    { label: "Single supplement", value: formatOptionalMoney(tour.singleSupplementEUR) },
    { label: "Deposit", value: depositText },
    { label: "Booking cutoff", value: bookingCutoffText },
    { label: "Cancellation policy", value: tour.cancellationPolicy },
    { label: "Payment terms", value: tour.paymentTerms }
  ].filter((item) => item.value);
  const canApplyAsGuide = !user || user.role === "traveller" || user.role === "tour_guide";

  return (
    <>
      <section className="detail-hero destination-detail-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div>
          <p className="eyebrow">{tour.category}</p>
          <h1>{tour.title}</h1>
          <p>{destinationStory?.hook || tour.shortDescription}</p>
          <div className="button-row">
            <button className="button primary" type="button" onClick={handleReferral} disabled={bookingLoading}>
              {bookingLoading ? "Starting..." : "Book with Travellex"}
            </button>
            <button className="button secondary light" type="button" onClick={handleSave}>
              Save tour
            </button>
            <a className="button secondary light" href="#quote">
              Request quote
            </a>
            {vrScene && (
              <a className="button secondary light" href="#tour-vr">
                Enter VR preview
              </a>
            )}
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
              {tour.comfortLevel || destinationStory?.priceLevel || "$$"}
            </span>
            <span>
              <strong>Operator</strong>
              {tour.partner?.name || "Travellex partner"}
            </span>
            <span>
              <strong>Reviews</strong>
              {rating ? `${rating.toFixed(1)} / 5 (${reviewCount || 0})` : "Travellex reviewed"}
            </span>
          </div>
          <div className="content-block">
            <p>📍 {compactDescription}</p>
            <p>
              🧭 Duration: {tour.duration}. Route base: {tour.location}. Listed from {eur.format(tour.priceEUR)} {tour.priceBasis || "Per person"}.
            </p>
          </div>
          <div className="tour-comparison-panel">
            <div>
              <p className="eyebrow">Compare this offer</p>
              <h2>Operator, route, comfort and inclusions.</h2>
            </div>
            <div className="comparison-grid">
              {comparisonItems.map((item) => (
                <span key={item.label}>
                  <strong>{item.label}</strong>
                  {item.value}
                </span>
              ))}
            </div>
            {tour.inclusions?.length > 0 && (
              <>
                <h3>Included</h3>
                <ul className="check-list compact">
                  {tour.inclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            {tour.exclusions?.length > 0 && (
              <>
                <h3>Excluded</h3>
                <ul className="check-list compact">
                  {tour.exclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {logisticsItems.length > 0 && (
            <div className="tour-comparison-panel">
              <div>
                <p className="eyebrow">Tour logistics</p>
                <h2>Meeting, movement and daily comfort.</h2>
              </div>
              <div className="comparison-grid">
                {logisticsItems.map((item) => (
                  <span key={item.label}>
                    <strong>{item.label}</strong>
                    {item.value}
                  </span>
                ))}
              </div>
            </div>
          )}
          <ImageGallery images={tour.images} />
          {vrScene && (
            <div className="tour-vr-preview" id="tour-vr">
              <div className="section-heading split">
                <div>
                  <p className="eyebrow">VR preview</p>
                  <h2>Step inside this tour</h2>
                </div>
                <p>Travellex admin-approved immersive media for this listing.</p>
              </div>
              <Suspense fallback={<Spinner label="Loading VR preview" />}>
                <VirtualTourCanvas scene={vrScene} />
              </Suspense>
            </div>
          )}
          {tour.highlights?.length > 0 && (
            <>
              <h2>Highlights</h2>
              <ul className="check-list">
                {tour.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </>
          )}
          {tour.itinerary?.length > 0 && (
            <>
              <h2>Itinerary</h2>
              <div className="timeline">
                {tour.itinerary.map((item) => (
                  <article key={`${item.day}-${item.title}`}>
                    <span>Day {item.day}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </>
          )}
          {(tour.whatToBring?.length > 0 || tour.notSuitableFor?.length > 0 || policyItems.length > 0) && (
            <div className="tour-comparison-panel">
              <div>
                <p className="eyebrow">Before you book</p>
                <h2>Preparation notes and terms.</h2>
              </div>
              {tour.whatToBring?.length > 0 && (
                <>
                  <h3>What to bring</h3>
                  <ul className="check-list compact">
                    {tour.whatToBring.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
              {tour.notSuitableFor?.length > 0 && (
                <>
                  <h3>Not suitable for</h3>
                  <ul className="check-list compact">
                    {tour.notSuitableFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
              {policyItems.length > 0 && (
                <div className="comparison-grid">
                  {policyItems.map((item) => (
                    <span key={item.label}>
                      <strong>{item.label}</strong>
                      {item.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
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
            <p className="eyebrow">Travellex hosted</p>
            <h2>{tour.partner?.name}</h2>
            <p>{tour.partner?.description || "This tour is fulfilled by an approved Travellex operator."}</p>
            <span>{tour.partner?.location}</span>
          </div>
          <div className="side-panel" id="quote">
            <p className="eyebrow">Request quote</p>
            <h2>Ask Travellex to confirm availability.</h2>
            <EnquiryForm requestType="quote" tour={tour} />
          </div>
          {canApplyAsGuide && (
            <div className="side-panel">
              <p className="eyebrow">Tour guide application</p>
              <h2>Apply to guide this tour</h2>
              <form className="panel-form" onSubmit={handleGuideApplication}>
                {!isAuthenticated && (
                  <div className="form-grid">
                    <label className="field">
                      <span>Name</span>
                      <input
                        value={guideApplicationForm.guideName}
                        onChange={(event) => updateGuideApplicationField("guideName", event.target.value)}
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={guideApplicationForm.email}
                        onChange={(event) => updateGuideApplicationField("email", event.target.value)}
                        required
                      />
                    </label>
                  </div>
                )}
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
          <small>{eur.format(tour.priceEUR)} · Travellex tracked booking</small>
        </span>
        <div className="button-row">
          <a className="button secondary compact" href="#quote">
            Quote
          </a>
          <button className="button primary compact" type="button" onClick={handleReferral} disabled={bookingLoading}>
            {bookingLoading ? "Starting..." : "Book with Travellex"}
          </button>
        </div>
      </div>
    </>
  );
}
