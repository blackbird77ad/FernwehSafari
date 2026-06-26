import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmActionButton from "../components/ConfirmActionButton";
import PaginatedList from "../components/PaginatedList";
import Spinner from "../components/Spinner";
import TourCard from "../components/TourCard";
import useAuth from "../hooks/useAuth";
import { getMyEnquiries } from "../services/enquiryService";
import {
  decideGuideApplicationByCompany,
  getGuideApplications,
  getGuideBookings,
  updateGuideBookingStatus
} from "../services/guideService";
import { getMyReferrals } from "../services/referralService";
import { createTour, deleteTour, getTours, updateTour } from "../services/tourService";
import { eur, formatDate } from "../utils/formatters";
import { activityOptions, comfortLevelOptions, tourTypeOptions } from "../utils/travelOptions";

const emptyCompanyTour = {
  title: "",
  shortDescription: "",
  description: "",
  priceEUR: "",
  duration: "",
  durationDays: "",
  location: "",
  category: "Safari",
  comfortLevel: "Midrange",
  tourType: "Private or shared",
  routeSummary: "",
  startLocation: "",
  endLocation: "",
  referralLink: "",
  images: "",
  inclusions: "",
  exclusions: "",
  availableFrom: "",
  availableTo: "",
  highlights: ""
};

export default function Dashboard() {
  const { removeSavedTour, user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [companyTours, setCompanyTours] = useState([]);
  const [guideApplications, setGuideApplications] = useState([]);
  const [guideBookings, setGuideBookings] = useState([]);
  const [tourForm, setTourForm] = useState(emptyCompanyTour);
  const [editingTourId, setEditingTourId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isTourCompany = user?.role === "tour_company";
  const isTourGuide = user?.role === "tour_guide";

  function updateTourField(field, value) {
    setTourForm((current) => ({ ...current, [field]: value }));
  }

  function serializeTourForm() {
    return {
      ...tourForm,
      priceEUR: Number(tourForm.priceEUR),
      durationDays: tourForm.durationDays === "" ? undefined : Number(tourForm.durationDays),
      images: tourForm.images
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      highlights: tourForm.highlights
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      inclusions: tourForm.inclusions
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      exclusions: tourForm.exclusions
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      availableFrom: tourForm.availableFrom || undefined,
      availableTo: tourForm.availableTo || undefined
    };
  }

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const baseRequests = [getMyEnquiries(), getMyReferrals()];

      if (isTourCompany) {
        baseRequests.push(getTours({ mine: true, includeInactive: true }));
        baseRequests.push(getGuideApplications());
        baseRequests.push(getGuideBookings());
      }

      if (isTourGuide) {
        baseRequests.push(getGuideApplications(), getGuideBookings());
      }

      const responses = await Promise.all(baseRequests);
      setEnquiries(responses[0].data.enquiries);
      setReferrals(responses[1].data.referrals);

      if (isTourCompany) {
        setCompanyTours(responses[2].data.tours);
        setGuideApplications(responses[3].data.applications);
        setGuideBookings(responses[4].data.bookings);
      }

      if (isTourGuide) {
        setGuideApplications(responses[2].data.applications);
        setGuideBookings(responses[3].data.bookings);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [isTourCompany, isTourGuide]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleRemove(tourId) {
    try {
      await removeSavedTour(tourId);
      setMessage("Saved tour removed.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleCompanyTourSubmit(event) {
    event.preventDefault();

    try {
      if (editingTourId) {
        await updateTour(editingTourId, serializeTourForm());
        setMessage("Tour updated and sent for staff review.");
      } else {
        await createTour(serializeTourForm());
        setMessage("Tour posted and sent for staff review.");
      }

      setTourForm(emptyCompanyTour);
      setEditingTourId("");
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editCompanyTour(tour) {
    setEditingTourId(tour._id);
    setTourForm({
      title: tour.title || "",
      shortDescription: tour.shortDescription || "",
      description: tour.description || "",
      priceEUR: tour.priceEUR || "",
      duration: tour.duration || "",
      durationDays: tour.durationDays || "",
      location: tour.location || "",
      category: tour.category || "Safari",
      comfortLevel: tour.comfortLevel || "Midrange",
      tourType: tour.tourType || "Private or shared",
      routeSummary: tour.routeSummary || "",
      startLocation: tour.startLocation || "",
      endLocation: tour.endLocation || "",
      referralLink: tour.referralLink || "",
      images: (tour.images || []).join("\n"),
      inclusions: (tour.inclusions || []).join("\n"),
      exclusions: (tour.exclusions || []).join("\n"),
      availableFrom: tour.availableFrom ? tour.availableFrom.slice(0, 10) : "",
      availableTo: tour.availableTo ? tour.availableTo.slice(0, 10) : "",
      highlights: (tour.highlights || []).join("\n")
    });
  }

  async function removeCompanyTour(id) {
    try {
      await deleteTour(id);
      setMessage("Tour deleted.");
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function changeGuideBookingStatus(id, status) {
    try {
      await updateGuideBookingStatus(id, status);
      setMessage("Guide booking updated.");
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function decideGuideApplication(id, decision) {
    const notes = window.prompt("Notes for this guide decision?") || "";

    try {
      await decideGuideApplicationByCompany(id, { decision, notes });
      setMessage(`Guide application ${decision}.`);
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <>
      <section className="page-hero compact-hero dashboard-hero">
        <p className="eyebrow">Dashboard</p>
        <h1>Welcome, {user?.name}.</h1>
      </section>
      <section className="section dashboard-layout">
        <div className="dashboard-main">
          {isTourCompany && (
            <section className="side-panel" id="company-tours">
              <p className="eyebrow">Tour company tools</p>
              <h2>{editingTourId ? "Edit tour" : "Post a tour"}</h2>
              <form className="panel-form" onSubmit={handleCompanyTourSubmit}>
                <label className="field">
                  <span>Title</span>
                  <input value={tourForm.title} onChange={(event) => updateTourField("title", event.target.value)} required />
                </label>
                <label className="field">
                  <span>Short description</span>
                  <input value={tourForm.shortDescription} onChange={(event) => updateTourField("shortDescription", event.target.value)} />
                </label>
                <label className="field">
                  <span>Description</span>
                  <textarea value={tourForm.description} onChange={(event) => updateTourField("description", event.target.value)} rows="4" />
                </label>
                <div className="form-grid">
                  <label className="field">
                    <span>Price EUR</span>
                    <input
                      type="number"
                      min="0"
                      value={tourForm.priceEUR}
                      onChange={(event) => updateTourField("priceEUR", event.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Duration</span>
                    <input value={tourForm.duration} onChange={(event) => updateTourField("duration", event.target.value)} required />
                  </label>
                  <label className="field">
                    <span>Duration days</span>
                    <input
                      type="number"
                      min="1"
                      value={tourForm.durationDays}
                      onChange={(event) => updateTourField("durationDays", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Location</span>
                    <input value={tourForm.location} onChange={(event) => updateTourField("location", event.target.value)} required />
                  </label>
                  <label className="field">
                    <span>Category</span>
                    <select value={tourForm.category} onChange={(event) => updateTourField("category", event.target.value)}>
                      {activityOptions.map((activity) => (
                        <option key={activity} value={activity}>
                          {activity}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>Comfort level</span>
                    <select value={tourForm.comfortLevel} onChange={(event) => updateTourField("comfortLevel", event.target.value)}>
                      {comfortLevelOptions.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Tour type</span>
                    <select value={tourForm.tourType} onChange={(event) => updateTourField("tourType", event.target.value)}>
                      {tourTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Start location</span>
                    <input value={tourForm.startLocation} onChange={(event) => updateTourField("startLocation", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>End location</span>
                    <input value={tourForm.endLocation} onChange={(event) => updateTourField("endLocation", event.target.value)} />
                  </label>
                </div>
                <label className="field">
                  <span>Route summary</span>
                  <input
                    value={tourForm.routeSummary}
                    onChange={(event) => updateTourField("routeSummary", event.target.value)}
                    placeholder="Arusha - Tarangire - Ngorongoro"
                  />
                </label>
                <div className="form-grid">
                  <label className="field">
                    <span>Available from</span>
                    <input type="date" value={tourForm.availableFrom} onChange={(event) => updateTourField("availableFrom", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Available to</span>
                    <input type="date" value={tourForm.availableTo} onChange={(event) => updateTourField("availableTo", event.target.value)} />
                  </label>
                </div>
                <label className="field">
                  <span>Booking/referral link</span>
                  <input value={tourForm.referralLink} onChange={(event) => updateTourField("referralLink", event.target.value)} />
                </label>
                <label className="field">
                  <span>Image URLs, one per line</span>
                  <textarea value={tourForm.images} onChange={(event) => updateTourField("images", event.target.value)} />
                </label>
                <label className="field">
                  <span>Inclusions, one per line</span>
                  <textarea value={tourForm.inclusions} onChange={(event) => updateTourField("inclusions", event.target.value)} />
                </label>
                <label className="field">
                  <span>Exclusions, one per line</span>
                  <textarea value={tourForm.exclusions} onChange={(event) => updateTourField("exclusions", event.target.value)} />
                </label>
                <label className="field">
                  <span>Highlights, one per line</span>
                  <textarea value={tourForm.highlights} onChange={(event) => updateTourField("highlights", event.target.value)} />
                </label>
                <div className="button-row">
                  <button className="button primary" type="submit">
                    {editingTourId ? "Update tour" : "Post tour"}
                  </button>
                  {editingTourId && (
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => {
                        setEditingTourId("");
                        setTourForm(emptyCompanyTour);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              <PaginatedList className="admin-list" items={companyTours} label="tours" emptyText="No company tours yet.">
                {(tour) => (
                  <article className="admin-row" key={tour._id}>
                    <div>
                      <strong>{tour.title}</strong>
                      <span>
                        {tour.isActive ? "Active" : "Pending staff review"} - {tour.location} - {eur.format(tour.priceEUR)}
                      </span>
                    </div>
                    <div className="button-row">
                      <button className="button secondary compact" type="button" onClick={() => editCompanyTour(tour)}>
                        Edit
                      </button>
                      <ConfirmActionButton
                        actionLabel={`Delete ${tour.title}`}
                        confirmMessage={`Delete tour "${tour.title}"? This cannot be undone.`}
                        iconOnly
                        onConfirm={() => removeCompanyTour(tour._id)}
                      />
                    </div>
                  </article>
                )}
              </PaginatedList>
              <h2>Guide applications for your tours</h2>
              <PaginatedList className="admin-list" items={guideApplications} label="guide applications" emptyText="No guide applications yet.">
                {(application) => (
                  <article className="admin-row" key={application._id}>
                    <div>
                      <strong>{application.guideName}</strong>
                      <span>
                        {application.tour?.title} - {application.status} -{" "}
                        {application.dailyRateEUR ? `${eur.format(application.dailyRateEUR)} per day` : "Rate not listed"}
                      </span>
                      <p>{application.message || "No message provided."}</p>
                    </div>
                    <div className="button-row">
                      <button
                        className="button primary compact"
                        type="button"
                        disabled={application.status !== "submitted"}
                        onClick={() => decideGuideApplication(application._id, "approved")}
                      >
                        Approve guide
                      </button>
                      <button
                        className="button danger compact"
                        type="button"
                        disabled={application.status !== "submitted"}
                        onClick={() => decideGuideApplication(application._id, "rejected")}
                      >
                        Reject guide
                      </button>
                    </div>
                  </article>
                )}
              </PaginatedList>
              <h2>Guide booking requests</h2>
              <PaginatedList className="admin-list" items={guideBookings} label="guide bookings" emptyText="No guide booking requests yet.">
                {(booking) => (
                  <article className="admin-row" key={booking._id}>
                    <div>
                      <strong>{booking.tour?.title}</strong>
                      <span>
                        Guide: {booking.guide?.name || "Guide"} - Traveller: {booking.name} - {booking.status}
                      </span>
                    </div>
                    <select value={booking.status} onChange={(event) => changeGuideBookingStatus(booking._id, event.target.value)}>
                      <option value="requested">requested</option>
                      <option value="accepted">accepted</option>
                      <option value="declined">declined</option>
                      <option value="closed">closed</option>
                    </select>
                  </article>
                )}
              </PaginatedList>
            </section>
          )}

          {isTourGuide && (
            <section className="side-panel">
              <p className="eyebrow">Tour guide tools</p>
              <h2>Your guide applications and requests.</h2>
              <PaginatedList className="admin-list" items={guideApplications} label="guide applications" emptyText="No guide applications yet. Open a tour page to apply.">
                {(application) => (
                  <article className="mini-row" key={application._id}>
                    <strong>{application.tour?.title}</strong>
                    <span>{application.status} - {formatDate(application.createdAt)}</span>
                  </article>
                )}
              </PaginatedList>
              <PaginatedList className="admin-list" items={guideBookings} label="guide bookings" emptyText="No guide booking requests yet.">
                {(booking) => (
                  <article className="admin-row" key={booking._id}>
                    <div>
                      <strong>{booking.tour?.title}</strong>
                      <span>
                        {booking.name} - {booking.travelDates || "No dates"} - {booking.status}
                      </span>
                    </div>
                    <select value={booking.status} onChange={(event) => changeGuideBookingStatus(booking._id, event.target.value)}>
                      <option value="requested">requested</option>
                      <option value="accepted">accepted</option>
                      <option value="declined">declined</option>
                      <option value="closed">closed</option>
                    </select>
                  </article>
                )}
              </PaginatedList>
            </section>
          )}

          <div className="section-heading small-heading" id="saved-tours">
            <p className="eyebrow">Saved tours</p>
            <h2>Your shortlist.</h2>
          </div>
          {user?.savedTours?.length ? (
            <PaginatedList className="paginated-card-section" gridClassName="card-grid tours-grid" items={user.savedTours} label="saved tours">
              {(tour) => (
                <div className="stacked-card" key={tour._id}>
                  <TourCard tour={tour} />
                  <ConfirmActionButton
                    actionLabel={`Remove ${tour.title} from saved tours`}
                    className="button secondary"
                    confirmMessage={`Remove "${tour.title}" from your saved tours?`}
                    onConfirm={() => handleRemove(tour._id)}
                  >
                    Remove
                  </ConfirmActionButton>
                </div>
              )}
            </PaginatedList>
          ) : (
            <p className="empty-state">
              No saved tours yet. <Link to="/tours">Browse tours</Link>
            </p>
          )}
        </div>
        <aside className="dashboard-side">
          <section className="side-panel" id="profile">
            <p className="eyebrow">Profile</p>
            <h2>{user?.name || "Travellex traveller"}</h2>
            <div className="profile-summary-list">
              <span>
                <strong>Email</strong>
                {user?.email || "Not provided"}
              </span>
              <span>
                <strong>Country</strong>
                {user?.country || "Not provided"}
              </span>
              <span>
                <strong>Account type</strong>
                {user?.role?.replace("_", " ") || "traveller"}
              </span>
            </div>
          </section>
          {loading ? (
            <Spinner />
          ) : (
            <>
              <section className="side-panel">
                <p className="eyebrow">Booking activity</p>
                {referrals.length ? (
                  referrals.map((referral) => (
                    <article className="mini-row" key={referral._id}>
                      <strong>{referral.tour?.title}</strong>
                      <span>Opened booking page - {formatDate(referral.clickedAt)}</span>
                    </article>
                  ))
                ) : (
                  <p>No booking activity yet.</p>
                )}
              </section>
              <section className="side-panel">
                <p className="eyebrow">Enquiry history</p>
                {enquiries.length ? (
                  enquiries.map((enquiry) => (
                    <article className="mini-row" key={enquiry._id}>
                      <strong>{enquiry.tour?.title || "General enquiry"}</strong>
                      <span>{enquiry.status} - {formatDate(enquiry.createdAt)}</span>
                    </article>
                  ))
                ) : (
                  <p>No enquiries yet.</p>
                )}
              </section>
            </>
          )}
          {message && <p className="form-note">{message}</p>}
        </aside>
      </section>
    </>
  );
}
