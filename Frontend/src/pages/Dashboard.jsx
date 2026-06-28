import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmActionButton from "../components/ConfirmActionButton";
import PaginatedList from "../components/PaginatedList";
import Spinner from "../components/Spinner";
import TourCard from "../components/TourCard";
import travellexLogo from "../assets/photos/Travellex-logo-wordmark.png";
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
import { uploadImage } from "../services/uploadService";
import { eur, formatDate } from "../utils/formatters";
import { activityOptions, comfortLevelOptions, confirmationTypeOptions, priceBasisOptions, tourTypeOptions } from "../utils/travelOptions";
import { formatItineraryText, formatListText, numberOrUndefined, parseItineraryText, splitLines } from "../utils/tourFormHelpers";

const emptyCompanyTour = {
  title: "",
  shortDescription: "",
  description: "",
  priceEUR: "",
  priceBasis: "Per person",
  childPriceEUR: "",
  singleSupplementEUR: "",
  depositPercent: "",
  bookingCutoffDays: "",
  confirmationType: "On request",
  duration: "",
  durationDays: "",
  location: "",
  category: "Safari",
  comfortLevel: "Midrange",
  tourType: "Private or shared",
  guideIncluded: true,
  customizable: true,
  groupSizeMin: "",
  groupSizeMax: "",
  minimumAge: "",
  languages: "",
  meetingPoint: "",
  pickupIncluded: false,
  pickupDetails: "",
  departureTime: "",
  returnTime: "",
  difficulty: "",
  accessibility: "",
  transport: "",
  accommodation: "",
  meals: "",
  cancellationPolicy: "",
  paymentTerms: "",
  whatToBring: "",
  notSuitableFor: "",
  routeSummary: "",
  startLocation: "",
  endLocation: "",
  referralLink: "",
  images: "",
  inclusions: "",
  exclusions: "",
  availableFrom: "",
  availableTo: "",
  availableWeekdays: "",
  highlights: "",
  itinerary: ""
};

const partnerListingTabs = [
  { value: "all", label: "All listings" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Not public" }
];

const partnerListingSortOptions = [
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
  { value: "title", label: "Title A-Z" },
  { value: "price-desc", label: "Highest price" },
  { value: "status", label: "Status" }
];

function emailDeliveryText(baseMessage, emailStatus) {
  if (emailStatus && emailStatus.sent === false) {
    return `${baseMessage} Email notification failed: ${emailStatus.reason || "Check Resend configuration."}`;
  }

  if (emailStatus?.sent) {
    return `${baseMessage} Email sent automatically.`;
  }

  return baseMessage;
}

function getListingStatus(tour) {
  return tour.isActive ? "active" : "pending";
}

function getListingStatusLabel(tour) {
  return tour.isActive ? "Active" : "Not public";
}

function compareText(left = "", right = "") {
  return String(left || "").localeCompare(String(right || ""), undefined, { sensitivity: "base" });
}

function compareDateNewest(left, right) {
  return new Date(right || 0).getTime() - new Date(left || 0).getTime();
}

function guideApplicationStatusLabel(status) {
  const labels = {
    submitted: "Awaiting partner review",
    company_approved: "Awaiting Travellex confirmation",
    company_rejected: "Rejected by partner",
    admin_approved: "Approved",
    admin_rejected: "Rejected by Travellex"
  };

  return labels[status] || String(status || "Not set").replace(/_/g, " ");
}

function guideBookingStatusLabel(status) {
  const labels = {
    requested: "New request",
    accepted: "Accepted",
    declined: "Declined",
    closed: "Closed"
  };

  return labels[status] || String(status || "Not set").replace(/_/g, " ");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, removeSavedTour, user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [companyTours, setCompanyTours] = useState([]);
  const [guideApplications, setGuideApplications] = useState([]);
  const [guideBookings, setGuideBookings] = useState([]);
  const [tourForm, setTourForm] = useState(emptyCompanyTour);
  const [editingTourId, setEditingTourId] = useState("");
  const [tourFormOpen, setTourFormOpen] = useState(false);
  const [expandedTourId, setExpandedTourId] = useState("");
  const [partnerListingTab, setPartnerListingTab] = useState("all");
  const [partnerListingSearch, setPartnerListingSearch] = useState("");
  const [partnerListingSort, setPartnerListingSort] = useState("newest");
  const [partnerListingView, setPartnerListingView] = useState("list");
  const [uploadingTourImage, setUploadingTourImage] = useState(false);
  const [submittingTour, setSubmittingTour] = useState(false);
  const [dashboardSidebarOpen, setDashboardSidebarOpen] = useState(false);
  const [showDashboardGreeting, setShowDashboardGreeting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isTourCompany = user?.role === "tour_company";
  const isTourGuide = user?.role === "tour_guide";
  const isOperationsDashboard = isTourCompany || isTourGuide;
  const dashboardRoleLabel = isTourCompany ? "Partner CRM" : isTourGuide ? "Guide dashboard" : "Dashboard";
  const dashboardNavItems = [
    { href: "#dashboard-overview", label: "Overview" },
    ...(isTourCompany
      ? [
          { href: "#company-tours", label: "Listings" },
          { href: "#guide-applications", label: "Guide applications" },
          { href: "#guide-requests", label: "Guide requests" }
        ]
      : []),
    ...(isTourGuide
      ? [
          { href: "#guide-tools", label: "Guide overview" },
          { href: "#guide-applications", label: "Applications" },
          { href: "#guide-bookings", label: "Booking requests" }
        ]
      : []),
    { href: "#saved-tours", label: "Saved tours" },
    { href: "#profile", label: "Profile" },
    { href: "#booking-activity", label: "Booking activity" },
    { href: "#enquiries", label: "Enquiries" }
  ];
  const partnerListingStats = useMemo(() => {
    const active = companyTours.filter((tour) => tour.isActive).length;
    const pending = companyTours.length - active;
    const guideQueue = guideApplications.filter((application) => application.status === "submitted").length;
    const bookingQueue = guideBookings.filter((booking) => booking.status === "requested").length;

    return {
      total: companyTours.length,
      active,
      pending,
      guideQueue,
      bookingQueue
    };
  }, [companyTours, guideApplications, guideBookings]);
  const guideDashboardStats = useMemo(() => {
    const awaitingPartner = guideApplications.filter((application) => application.status === "submitted").length;
    const awaitingTravellex = guideApplications.filter((application) => application.status === "company_approved").length;
    const approved = guideApplications.filter((application) => application.status === "admin_approved").length;
    const rejected = guideApplications.filter((application) =>
      ["company_rejected", "admin_rejected"].includes(application.status)
    ).length;
    const openRequests = guideBookings.filter((booking) => booking.status === "requested").length;

    return {
      applications: guideApplications.length,
      awaitingPartner,
      awaitingTravellex,
      approved,
      rejected,
      openRequests,
      bookings: guideBookings.length
    };
  }, [guideApplications, guideBookings]);
  const sortedGuideApplications = useMemo(
    () => [...guideApplications].sort((left, right) => compareDateNewest(left.createdAt, right.createdAt)),
    [guideApplications]
  );
  const sortedGuideBookings = useMemo(
    () => [...guideBookings].sort((left, right) => compareDateNewest(left.createdAt, right.createdAt)),
    [guideBookings]
  );
  const visibleCompanyTours = useMemo(() => {
    const search = partnerListingSearch.trim().toLowerCase();
    const filtered = companyTours.filter((tour) => {
      const statusMatches = partnerListingTab === "all" || getListingStatus(tour) === partnerListingTab;
      const searchText = [
        tour.title,
        tour.location,
        tour.category,
        tour.shortDescription,
        tour.description,
        tour.routeSummary,
        tour.startLocation,
        tour.endLocation,
        tour.comfortLevel,
        tour.tourType,
        tour.priceBasis,
        tour.confirmationType,
        tour.languages,
        tour.meetingPoint,
        tour.pickupDetails,
        tour.difficulty,
        tour.accessibility,
        tour.transport,
        tour.accommodation,
        tour.meals,
        tour.cancellationPolicy,
        tour.paymentTerms,
        tour.availableWeekdays,
        tour.whatToBring,
        tour.notSuitableFor,
        ...(tour.itinerary || []).flatMap((item) => [item.title, item.description])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return statusMatches && (!search || searchText.includes(search));
    });

    return [...filtered].sort((left, right) => {
      if (partnerListingSort === "updated") {
        return compareDateNewest(left.updatedAt, right.updatedAt);
      }

      if (partnerListingSort === "title") {
        return compareText(left.title, right.title);
      }

      if (partnerListingSort === "price-desc") {
        return Number(right.priceEUR || 0) - Number(left.priceEUR || 0);
      }

      if (partnerListingSort === "status") {
        return compareText(getListingStatusLabel(left), getListingStatusLabel(right)) || compareText(left.title, right.title);
      }

      return compareDateNewest(left.createdAt, right.createdAt);
    });
  }, [companyTours, partnerListingSearch, partnerListingSort, partnerListingTab]);

  function updateTourField(field, value) {
    setTourForm((current) => ({ ...current, [field]: value }));
  }

  function serializeTourForm() {
    return {
      ...tourForm,
      priceEUR: Number(tourForm.priceEUR),
      childPriceEUR: numberOrUndefined(tourForm.childPriceEUR),
      singleSupplementEUR: numberOrUndefined(tourForm.singleSupplementEUR),
      depositPercent: numberOrUndefined(tourForm.depositPercent),
      bookingCutoffDays: numberOrUndefined(tourForm.bookingCutoffDays),
      durationDays: numberOrUndefined(tourForm.durationDays),
      groupSizeMin: numberOrUndefined(tourForm.groupSizeMin),
      groupSizeMax: numberOrUndefined(tourForm.groupSizeMax),
      minimumAge: numberOrUndefined(tourForm.minimumAge),
      languages: splitLines(tourForm.languages),
      pickupIncluded: Boolean(tourForm.pickupIncluded),
      guideIncluded: Boolean(tourForm.guideIncluded),
      customizable: Boolean(tourForm.customizable),
      whatToBring: splitLines(tourForm.whatToBring),
      notSuitableFor: splitLines(tourForm.notSuitableFor),
      availableWeekdays: splitLines(tourForm.availableWeekdays),
      images: splitLines(tourForm.images),
      highlights: splitLines(tourForm.highlights),
      inclusions: splitLines(tourForm.inclusions),
      exclusions: splitLines(tourForm.exclusions),
      itinerary: parseItineraryText(tourForm.itinerary),
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

  useEffect(() => {
    setShowDashboardGreeting(true);
    const timer = window.setTimeout(() => setShowDashboardGreeting(false), 60000);

    return () => window.clearTimeout(timer);
  }, [user?._id]);

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

    if (submittingTour) {
      return;
    }

    setSubmittingTour(true);

    try {
      if (editingTourId) {
        await updateTour(editingTourId, serializeTourForm());
        setMessage("Tour updated on the public Travellex tours page.");
      } else {
        await createTour(serializeTourForm());
        setMessage("Tour published on the public Travellex tours page.");
      }

      setTourForm(emptyCompanyTour);
      setEditingTourId("");
      setTourFormOpen(false);
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmittingTour(false);
    }
  }

  function editCompanyTour(tour) {
    setEditingTourId(tour._id);
    setTourFormOpen(true);
    setExpandedTourId(tour._id);
    setTourForm({
      title: tour.title || "",
      shortDescription: tour.shortDescription || "",
      description: tour.description || "",
      priceEUR: tour.priceEUR || "",
      priceBasis: tour.priceBasis || "Per person",
      childPriceEUR: tour.childPriceEUR ?? "",
      singleSupplementEUR: tour.singleSupplementEUR ?? "",
      depositPercent: tour.depositPercent ?? "",
      bookingCutoffDays: tour.bookingCutoffDays ?? "",
      confirmationType: tour.confirmationType || "On request",
      duration: tour.duration || "",
      durationDays: tour.durationDays || "",
      location: tour.location || "",
      category: tour.category || "Safari",
      comfortLevel: tour.comfortLevel || "Midrange",
      tourType: tour.tourType || "Private or shared",
      guideIncluded: tour.guideIncluded !== false,
      customizable: tour.customizable !== false,
      groupSizeMin: tour.groupSizeMin ?? "",
      groupSizeMax: tour.groupSizeMax ?? "",
      minimumAge: tour.minimumAge ?? "",
      languages: formatListText(tour.languages),
      meetingPoint: tour.meetingPoint || "",
      pickupIncluded: Boolean(tour.pickupIncluded),
      pickupDetails: tour.pickupDetails || "",
      departureTime: tour.departureTime || "",
      returnTime: tour.returnTime || "",
      difficulty: tour.difficulty || "",
      accessibility: tour.accessibility || "",
      transport: tour.transport || "",
      accommodation: tour.accommodation || "",
      meals: tour.meals || "",
      cancellationPolicy: tour.cancellationPolicy || "",
      paymentTerms: tour.paymentTerms || "",
      whatToBring: formatListText(tour.whatToBring),
      notSuitableFor: formatListText(tour.notSuitableFor),
      routeSummary: tour.routeSummary || "",
      startLocation: tour.startLocation || "",
      endLocation: tour.endLocation || "",
      referralLink: tour.referralLink || "",
      images: formatListText(tour.images),
      inclusions: formatListText(tour.inclusions),
      exclusions: formatListText(tour.exclusions),
      availableFrom: tour.availableFrom ? tour.availableFrom.slice(0, 10) : "",
      availableTo: tour.availableTo ? tour.availableTo.slice(0, 10) : "",
      availableWeekdays: formatListText(tour.availableWeekdays),
      highlights: formatListText(tour.highlights),
      itinerary: formatItineraryText(tour.itinerary)
    });
  }

  async function handleTourImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingTourImage(true);

    try {
      const response = await uploadImage(file);
      setTourForm((current) => ({
        ...current,
        images: [current.images, response.data.url].filter(Boolean).join("\n")
      }));
      setMessage("Image uploaded and added to this listing.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploadingTourImage(false);
      event.target.value = "";
    }
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
    try {
      const response = await decideGuideApplicationByCompany(id, { decision, notes: "" });
      setMessage(emailDeliveryText(`Guide application ${decision}.`, response.data.emailStatus));
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleDashboardLogout() {
    logout();
    navigate("/");
  }

  function closeDashboardSidebar() {
    setDashboardSidebarOpen(false);
  }

  return (
    <div className={isOperationsDashboard ? `dashboard-workspace-frame ${dashboardSidebarOpen ? "sidebar-open" : ""}` : ""}>
      {isOperationsDashboard ? (
        <>
          {dashboardSidebarOpen && (
            <button
              className="dashboard-sidebar-backdrop"
              type="button"
              aria-label="Close dashboard navigation"
              onClick={closeDashboardSidebar}
            />
          )}
          <aside className="dashboard-role-sidebar" id="dashboard-role-sidebar" aria-label="Dashboard navigation">
            <div className="dashboard-sidebar-head">
              <Link className="dashboard-sidebar-brand" to="/" onClick={closeDashboardSidebar} aria-label="Travellex home">
                <img src={travellexLogo} alt="Travellex" />
              </Link>
              <button
                className="dashboard-menu-button inside"
                type="button"
                aria-label="Close dashboard navigation"
                onClick={closeDashboardSidebar}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
            <div className="dashboard-sidebar-profile">
              <span>{dashboardRoleLabel}</span>
              <strong>{user?.name || "Travellex user"}</strong>
              <small>{user?.email}</small>
            </div>
            <nav className="dashboard-role-nav">
              {dashboardNavItems.map((item) => (
                <a href={item.href} key={item.href} onClick={closeDashboardSidebar}>
                  {item.label}
                </a>
              ))}
            </nav>
            <button className="button secondary dashboard-logout-button" type="button" onClick={handleDashboardLogout}>
              Logout
            </button>
          </aside>
          <header className="dashboard-workspace-topbar" id="dashboard-overview">
            <button
              className="dashboard-menu-button"
              type="button"
              aria-label="Open dashboard navigation"
              aria-controls="dashboard-role-sidebar"
              aria-expanded={dashboardSidebarOpen}
              onClick={() => setDashboardSidebarOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <div>
              <p className="eyebrow">{dashboardRoleLabel}</p>
              <h1>{showDashboardGreeting ? `Welcome, ${user?.name}.` : dashboardRoleLabel}</h1>
            </div>
            <div className="button-row">
              <details className="dashboard-profile-menu" id="profile">
                <summary aria-label="Open profile">
                  <span>{user?.name?.slice(0, 1) || "U"}</span>
                </summary>
                <div className="dashboard-profile-popover">
                  <strong>{user?.name || "Travellex user"}</strong>
                  <small>{user?.email || "Email not provided"}</small>
                  <small>{user?.country || "Country not provided"}</small>
                </div>
              </details>
              <Link className="button secondary compact" to="/tours">
                Browse tours
              </Link>
              <button className="button primary compact" type="button" onClick={handleDashboardLogout}>
                Logout
              </button>
            </div>
          </header>
        </>
      ) : (
        <section className="page-hero compact-hero dashboard-hero">
          <p className="eyebrow">Dashboard</p>
          <h1>{showDashboardGreeting ? `Welcome, ${user?.name}.` : "Dashboard"}</h1>
        </section>
      )}
      <section className={isOperationsDashboard ? "section dashboard-layout dashboard-operations-layout" : "section dashboard-layout"}>
        <div className="dashboard-main">
          {isTourCompany && (
            <section className="partner-crm-shell" id="company-tours">
              <div className="partner-crm-head">
                <div>
                  <p className="eyebrow">Partner CRM</p>
                  <h2>Manage listings, guide applications and requests.</h2>
                </div>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => {
                    setEditingTourId("");
                    setTourForm(emptyCompanyTour);
                    setTourFormOpen(true);
                  }}
                >
                  Create listing
                </button>
              </div>

              <div className="partner-crm-metrics">
                <span>
                  <strong>{partnerListingStats.total}</strong>
                  Listings
                </span>
                <span>
                  <strong>{partnerListingStats.active}</strong>
                  Active
                </span>
                <span>
                  <strong>{partnerListingStats.pending}</strong>
                  Not public
                </span>
                <span>
                  <strong>{partnerListingStats.guideQueue}</strong>
                  Guide applications
                </span>
                <span>
                  <strong>{partnerListingStats.bookingQueue}</strong>
                  Guide requests
                </span>
              </div>

              <section className="side-panel partner-tour-editor">
                <button
                  className="crm-form-toggle"
                  type="button"
                  onClick={() => setTourFormOpen((current) => !current)}
                  aria-expanded={tourFormOpen}
                >
                  <span>{editingTourId ? "Editing listing" : "Listing editor"}</span>
                  <strong>{tourFormOpen ? "Hide editor" : "Open editor"}</strong>
                </button>
                {tourFormOpen && (
                  <form className="panel-form partner-listing-form" onSubmit={handleCompanyTourSubmit}>
                    <h2>{editingTourId ? "Edit listing" : "Create listing"}</h2>
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
                        <span>Price basis</span>
                        <select value={tourForm.priceBasis} onChange={(event) => updateTourField("priceBasis", event.target.value)}>
                          {priceBasisOptions.map((basis) => (
                            <option key={basis} value={basis}>
                              {basis}
                            </option>
                          ))}
                        </select>
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
                        <span>Child price EUR</span>
                        <input
                          type="number"
                          min="0"
                          value={tourForm.childPriceEUR}
                          onChange={(event) => updateTourField("childPriceEUR", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Single supplement EUR</span>
                        <input
                          type="number"
                          min="0"
                          value={tourForm.singleSupplementEUR}
                          onChange={(event) => updateTourField("singleSupplementEUR", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Deposit %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tourForm.depositPercent}
                          onChange={(event) => updateTourField("depositPercent", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Booking cutoff days</span>
                        <input
                          type="number"
                          min="0"
                          value={tourForm.bookingCutoffDays}
                          onChange={(event) => updateTourField("bookingCutoffDays", event.target.value)}
                        />
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
                    <div className="checkbox-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={tourForm.guideIncluded}
                          onChange={(event) => updateTourField("guideIncluded", event.target.checked)}
                        />
                        Guide included
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={tourForm.customizable}
                          onChange={(event) => updateTourField("customizable", event.target.checked)}
                        />
                        Customizable
                      </label>
                    </div>
                    <div className="form-grid">
                      <label className="field">
                        <span>Group size min</span>
                        <input
                          type="number"
                          min="1"
                          value={tourForm.groupSizeMin}
                          onChange={(event) => updateTourField("groupSizeMin", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Group size max</span>
                        <input
                          type="number"
                          min="1"
                          value={tourForm.groupSizeMax}
                          onChange={(event) => updateTourField("groupSizeMax", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Minimum age</span>
                        <input
                          type="number"
                          min="0"
                          value={tourForm.minimumAge}
                          onChange={(event) => updateTourField("minimumAge", event.target.value)}
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span>Languages, one per line</span>
                      <textarea value={tourForm.languages} onChange={(event) => updateTourField("languages", event.target.value)} rows="3" />
                    </label>
                    <label className="field">
                      <span>Route summary</span>
                      <input
                        value={tourForm.routeSummary}
                        onChange={(event) => updateTourField("routeSummary", event.target.value)}
                        placeholder="Arusha - Tarangire - Ngorongoro"
                      />
                    </label>
                    <label className="field">
                      <span>Daily itinerary, one day per line</span>
                      <textarea
                        value={tourForm.itinerary}
                        onChange={(event) => updateTourField("itinerary", event.target.value)}
                        placeholder="Day 1 | Arrival in Arusha | Pickup, briefing and overnight stay"
                        rows="5"
                      />
                    </label>
                    <div className="form-grid">
                      <label className="field">
                        <span>Meeting point</span>
                        <input value={tourForm.meetingPoint} onChange={(event) => updateTourField("meetingPoint", event.target.value)} />
                      </label>
                      <label className="field">
                        <span>Departure time</span>
                        <input
                          value={tourForm.departureTime}
                          onChange={(event) => updateTourField("departureTime", event.target.value)}
                          placeholder="08:00 or Flexible"
                        />
                      </label>
                      <label className="field">
                        <span>Return time</span>
                        <input
                          value={tourForm.returnTime}
                          onChange={(event) => updateTourField("returnTime", event.target.value)}
                          placeholder="17:30 or Flexible"
                        />
                      </label>
                    </div>
                    <label className="checkbox-inline">
                      <input
                        type="checkbox"
                        checked={tourForm.pickupIncluded}
                        onChange={(event) => updateTourField("pickupIncluded", event.target.checked)}
                      />
                      Pickup included
                    </label>
                    <label className="field">
                      <span>Pickup details</span>
                      <textarea value={tourForm.pickupDetails} onChange={(event) => updateTourField("pickupDetails", event.target.value)} rows="2" />
                    </label>
                    <div className="form-grid">
                      <label className="field">
                        <span>Difficulty</span>
                        <input value={tourForm.difficulty} onChange={(event) => updateTourField("difficulty", event.target.value)} />
                      </label>
                      <label className="field">
                        <span>Accessibility notes</span>
                        <input
                          value={tourForm.accessibility}
                          onChange={(event) => updateTourField("accessibility", event.target.value)}
                          placeholder="Wheelchair access, mobility limits, steps"
                        />
                      </label>
                      <label className="field">
                        <span>Transport</span>
                        <input value={tourForm.transport} onChange={(event) => updateTourField("transport", event.target.value)} />
                      </label>
                      <label className="field">
                        <span>Accommodation</span>
                        <input value={tourForm.accommodation} onChange={(event) => updateTourField("accommodation", event.target.value)} />
                      </label>
                      <label className="field">
                        <span>Meals</span>
                        <input value={tourForm.meals} onChange={(event) => updateTourField("meals", event.target.value)} />
                      </label>
                    </div>
                    <div className="form-grid">
                      <label className="field">
                        <span>Available from</span>
                        <input type="date" value={tourForm.availableFrom} onChange={(event) => updateTourField("availableFrom", event.target.value)} />
                      </label>
                      <label className="field">
                        <span>Available to</span>
                        <input type="date" value={tourForm.availableTo} onChange={(event) => updateTourField("availableTo", event.target.value)} />
                      </label>
                      <label className="field">
                        <span>Confirmation type</span>
                        <select value={tourForm.confirmationType} onChange={(event) => updateTourField("confirmationType", event.target.value)}>
                          {confirmationTypeOptions.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="field">
                      <span>Available weekdays, one per line</span>
                      <textarea
                        value={tourForm.availableWeekdays}
                        onChange={(event) => updateTourField("availableWeekdays", event.target.value)}
                        placeholder={"Daily\nMonday\nFriday"}
                        rows="3"
                      />
                    </label>
                    <label className="field">
                      <span>External booking/referral link (optional)</span>
                      <input
                        value={tourForm.referralLink}
                        onChange={(event) => updateTourField("referralLink", event.target.value)}
                        placeholder="Leave blank to keep booking inside Travellex"
                      />
                    </label>
                    <label className="field">
                      <span>Upload tour image</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleTourImageUpload} disabled={uploadingTourImage} />
                    </label>
                    {uploadingTourImage && <p className="form-note">Uploading image...</p>}
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
                    <label className="field">
                      <span>What to bring, one per line</span>
                      <textarea value={tourForm.whatToBring} onChange={(event) => updateTourField("whatToBring", event.target.value)} />
                    </label>
                    <label className="field">
                      <span>Not suitable for, one per line</span>
                      <textarea value={tourForm.notSuitableFor} onChange={(event) => updateTourField("notSuitableFor", event.target.value)} />
                    </label>
                    <label className="field">
                      <span>Cancellation policy</span>
                      <textarea
                        value={tourForm.cancellationPolicy}
                        onChange={(event) => updateTourField("cancellationPolicy", event.target.value)}
                        rows="3"
                      />
                    </label>
                    <label className="field">
                      <span>Payment terms</span>
                      <textarea value={tourForm.paymentTerms} onChange={(event) => updateTourField("paymentTerms", event.target.value)} rows="3" />
                    </label>
                    <div className="button-row">
                      <button className="button primary" type="submit" disabled={submittingTour || uploadingTourImage}>
                        {submittingTour ? "Publishing..." : editingTourId ? "Update listing" : "Publish listing"}
                      </button>
                      {(editingTourId || tourFormOpen) && (
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => {
                            setEditingTourId("");
                            setTourForm(emptyCompanyTour);
                            setTourFormOpen(false);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </section>

              <section className="side-panel partner-listing-manager">
                <div className="tab-row partner-crm-tabs" role="tablist" aria-label="Listing status">
                  {partnerListingTabs.map((tab) => {
                    const count =
                      tab.value === "active"
                        ? partnerListingStats.active
                        : tab.value === "pending"
                          ? partnerListingStats.pending
                          : partnerListingStats.total;

                    return (
                      <button
                        className={partnerListingTab === tab.value ? "active" : ""}
                        key={tab.value}
                        type="button"
                        onClick={() => setPartnerListingTab(tab.value)}
                      >
                        {tab.label} ({count})
                      </button>
                    );
                  })}
                </div>
                <div className="partner-crm-toolbar">
                  <label className="field">
                    <span>Search listings</span>
                    <input
                      value={partnerListingSearch}
                      onChange={(event) => setPartnerListingSearch(event.target.value)}
                      placeholder="Title, route, location or category"
                    />
                  </label>
                  <label className="field">
                    <span>Sort</span>
                    <select value={partnerListingSort} onChange={(event) => setPartnerListingSort(event.target.value)}>
                      {partnerListingSortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="admin-view-switch" role="group" aria-label="Listing view">
                    {["list", "cards", "compact"].map((mode) => (
                      <button
                        className={partnerListingView === mode ? "active" : ""}
                        key={mode}
                        type="button"
                        onClick={() => setPartnerListingView(mode)}
                        aria-pressed={partnerListingView === mode}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <p className="form-note">
                    Showing {visibleCompanyTours.length} of {companyTours.length} listings.
                  </p>
                </div>
                {visibleCompanyTours.length ? (
                  <div className={`partner-listing-grid view-${partnerListingView}`}>
                    {visibleCompanyTours.map((tour) => (
                      <article
                        className={expandedTourId === tour._id ? "partner-listing-card expanded" : "partner-listing-card"}
                        key={tour._id}
                      >
                        <div className="partner-listing-row">
                          <div>
                            <button
                              className="listing-title-button"
                              type="button"
                              onClick={() => setExpandedTourId((current) => (current === tour._id ? "" : tour._id))}
                              aria-expanded={expandedTourId === tour._id}
                            >
                              {tour.title}
                            </button>
                            <span>
                              {tour.location} - {eur.format(tour.priceEUR)} - {tour.duration}
                            </span>
                          </div>
                          <span className={`listing-status listing-status-${getListingStatus(tour)}`}>
                            {getListingStatusLabel(tour)}
                          </span>
                        </div>
                        <div className="listing-meta-grid">
                          <span>{tour.category}</span>
                          <span>{tour.comfortLevel}</span>
                          <span>{tour.tourType}</span>
                          <span>{tour.updatedAt ? `Updated ${formatDate(tour.updatedAt)}` : "New listing"}</span>
                        </div>
                        {expandedTourId === tour._id && (
                          <div className="listing-expanded-detail">
                            <p>{tour.shortDescription || tour.description || "No description saved yet."}</p>
                            <div className="listing-detail-grid">
                              <span>Route: {tour.routeSummary || [tour.startLocation, tour.endLocation].filter(Boolean).join(" - ") || "Not listed"}</span>
                              <span>
                                Group: {[tour.groupSizeMin, tour.groupSizeMax].filter(Boolean).join("-") || "Not listed"}
                              </span>
                              <span>Languages: {tour.languages?.join(", ") || "Not listed"}</span>
                              <span>Pickup: {tour.pickupIncluded ? tour.pickupDetails || "Included" : "Not included"}</span>
                              <span>Price basis: {tour.priceBasis || "Not listed"}</span>
                              <span>Confirmation: {tour.confirmationType || "Not listed"}</span>
                              <span>Guide included: {tour.guideIncluded === false ? "No" : "Yes"}</span>
                              <span>Customizable: {tour.customizable === false ? "No" : "Yes"}</span>
                              <span>Itinerary days: {tour.itinerary?.length || 0}</span>
                              <span>Images: {tour.images?.length || 0}</span>
                              <span>Highlights: {tour.highlights?.length || 0}</span>
                              <span>Inclusions: {tour.inclusions?.length || 0}</span>
                            </div>
                          </div>
                        )}
                        <div className="button-row">
                          {tour.isActive && tour.slug && (
                            <Link className="button secondary compact" to={`/tours/${tour.slug}`}>
                              View
                            </Link>
                          )}
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
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No listings match this view.</p>
                )}
              </section>

              <div className="partner-crm-operations">
                <section className="side-panel" id="guide-applications">
                  <p className="eyebrow">Guide applications</p>
                  <h2>Review applicants for your tours.</h2>
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
                            Approve & email
                          </button>
                          <button
                            className="button danger compact"
                            type="button"
                            disabled={application.status !== "submitted"}
                            onClick={() => decideGuideApplication(application._id, "rejected")}
                          >
                            Reject & email
                          </button>
                        </div>
                      </article>
                    )}
                  </PaginatedList>
                </section>
                <section className="side-panel" id="guide-requests">
                  <p className="eyebrow">Guide requests</p>
                  <h2>Manage traveller guide requests.</h2>
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
              </div>
            </section>
          )}

          {isTourGuide && (
            <section className="guide-dashboard-shell" id="guide-tools">
              <div className="guide-dashboard-head">
                <div>
                  <p className="eyebrow">Tour guide dashboard</p>
                  <h2>Track tour applications and traveller guide requests.</h2>
                </div>
                <Link className="button primary" to="/tours">
                  Find tours
                </Link>
              </div>

              <div className="guide-dashboard-metrics">
                <span>
                  <strong>{guideDashboardStats.applications}</strong>
                  Applications
                </span>
                <span>
                  <strong>{guideDashboardStats.awaitingPartner}</strong>
                  Partner review
                </span>
                <span>
                  <strong>{guideDashboardStats.awaitingTravellex}</strong>
                  Travellex review
                </span>
                <span>
                  <strong>{guideDashboardStats.approved}</strong>
                  Approved tours
                </span>
                <span>
                  <strong>{guideDashboardStats.openRequests}</strong>
                  New requests
                </span>
              </div>

              <div className="guide-dashboard-grid">
                <section className="side-panel guide-work-panel" id="guide-applications">
                  <div className="section-heading split small-heading">
                    <div>
                      <p className="eyebrow">Applications</p>
                      <h2>Your tour guide applications.</h2>
                    </div>
                    <span className="guide-panel-count">{guideDashboardStats.rejected} rejected</span>
                  </div>
                  <PaginatedList
                    className="admin-list"
                    items={sortedGuideApplications}
                    label="guide applications"
                    emptyText="No guide applications yet. Open a tour page to apply."
                  >
                    {(application) => (
                      <article className="guide-work-card" key={application._id}>
                        <div>
                          <strong>{application.tour?.title || "Tour application"}</strong>
                          <span>
                            {application.tour?.location || "Location not listed"} - {formatDate(application.createdAt)}
                          </span>
                          {application.dailyRateEUR && <p>{eur.format(application.dailyRateEUR)} per day</p>}
                        </div>
                        <span className={`guide-status guide-status-${application.status}`}>
                          {guideApplicationStatusLabel(application.status)}
                        </span>
                      </article>
                    )}
                  </PaginatedList>
                </section>

                <section className="side-panel guide-work-panel" id="guide-bookings">
                  <div className="section-heading split small-heading">
                    <div>
                      <p className="eyebrow">Booking requests</p>
                      <h2>Traveller requests for your guide service.</h2>
                    </div>
                    <span className="guide-panel-count">{guideDashboardStats.bookings} total</span>
                  </div>
                  <PaginatedList className="admin-list" items={sortedGuideBookings} label="guide bookings" emptyText="No guide booking requests yet.">
                    {(booking) => (
                      <article className="guide-work-card guide-booking-card" key={booking._id}>
                        <div>
                          <strong>{booking.tour?.title || "Guide request"}</strong>
                          <span>
                            {booking.name} - {booking.travelDates || "No dates"} - {booking.groupSize || "Group size not listed"}
                          </span>
                          {booking.message && <p>{booking.message}</p>}
                        </div>
                        <label className="field compact-select">
                          <span>Status</span>
                          <select value={booking.status} onChange={(event) => changeGuideBookingStatus(booking._id, event.target.value)}>
                            <option value="requested">{guideBookingStatusLabel("requested")}</option>
                            <option value="accepted">{guideBookingStatusLabel("accepted")}</option>
                            <option value="declined">{guideBookingStatusLabel("declined")}</option>
                            <option value="closed">{guideBookingStatusLabel("closed")}</option>
                          </select>
                        </label>
                      </article>
                    )}
                  </PaginatedList>
                </section>
              </div>
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
          {!isOperationsDashboard && (
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
          )}
          {loading ? (
            <Spinner />
          ) : (
            <>
              <section className="side-panel" id="booking-activity">
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
              <section className="side-panel" id="enquiries">
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
    </div>
  );
}
