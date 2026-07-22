import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmActionButton from "../components/ConfirmActionButton";
import PaginatedList from "../components/PaginatedList";
import Spinner from "../components/Spinner";
import TourCard from "../components/TourCard";
import TourListingForm from "../components/TourListingForm";
import fallbackTourImage from "../assets/photos/ngorongoro-wide-with-tourists.jpg";
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
import { formatItineraryText, formatListText, numberOrUndefined, parseItineraryText, splitLines } from "../utils/tourFormHelpers";
import {
  appendTourMedia,
  formatTourMediaText,
  isTourMediaLimitExceeded,
  isVideoMedia,
  MAX_TOUR_MEDIA_ITEMS,
  normalizeTourMedia,
  splitTourMedia
} from "../utils/tourMedia";

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

function TourManagementMedia({ tour }) {
  const media = normalizeTourMedia(tour.images);
  const firstMedia = media[0] || fallbackTourImage;

  return (
    <div className="management-listing-media partner-listing-media">
      {isVideoMedia(firstMedia) ? (
        <video src={firstMedia} muted loop playsInline preload="metadata" />
      ) : (
        <img src={firstMedia} alt={`${tour.title} preview`} loading="lazy" />
      )}
      <span>{media.length ? `${media.length}/${MAX_TOUR_MEDIA_ITEMS} media` : "Add media"}</span>
    </div>
  );
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
      images: normalizeTourMedia(tourForm.images),
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
      if (isTourMediaLimitExceeded(tourForm.images)) {
        throw new Error(`Tours can include up to ${MAX_TOUR_MEDIA_ITEMS} images or videos.`);
      }

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
      images: formatTourMediaText(tour.images),
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

    if (splitTourMedia(tourForm.images).length >= MAX_TOUR_MEDIA_ITEMS) {
      setMessage(`This listing already has ${MAX_TOUR_MEDIA_ITEMS} media items.`);
      event.target.value = "";
      return;
    }

    setUploadingTourImage(true);

    try {
      const response = await uploadImage(file);
      setTourForm((current) => ({
        ...current,
        images: appendTourMedia(current.images, response.data.url)
      }));
      setMessage("Media uploaded and added to this listing.");
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
                  <TourListingForm
                    cancelLabel="Cancel"
                    editing={Boolean(editingTourId)}
                    form={tourForm}
                    onCancel={() => {
                      setEditingTourId("");
                      setTourForm(emptyCompanyTour);
                      setTourFormOpen(false);
                    }}
                    onFieldChange={updateTourField}
                    onSubmit={handleCompanyTourSubmit}
                    onUpload={handleTourImageUpload}
                    submitting={submittingTour}
                    submitLabel={editingTourId ? "Update listing" : "Publish listing"}
                    uploading={uploadingTourImage}
                  />
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
                        <TourManagementMedia tour={tour} />
                        <div className="partner-listing-content">
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
                                {tour.location} - {tour.duration || "Duration not set"}
                              </span>
                            </div>
                            <div className="partner-listing-price">
                              <strong>{eur.format(tour.priceEUR)}</strong>
                              <span>{tour.priceBasis || "Per person"}</span>
                            </div>
                            <span className={`listing-status listing-status-${getListingStatus(tour)}`}>
                              {getListingStatusLabel(tour)}
                            </span>
                          </div>
                          <div className="listing-meta-grid">
                            <span>{tour.category}</span>
                            <span>{tour.comfortLevel}</span>
                            <span>{tour.tourType}</span>
                            <span>{tour.images?.length || 0}/{MAX_TOUR_MEDIA_ITEMS} media</span>
                            <span>{tour.updatedAt ? `Updated ${formatDate(tour.updatedAt)}` : "New listing"}</span>
                          </div>
                          <p className="partner-listing-summary">{tour.shortDescription || tour.routeSummary || tour.description || "No description saved yet."}</p>
                          {expandedTourId === tour._id && (
                            <div className="listing-expanded-detail">
                              <div className="listing-detail-grid">
                                <span>Route: {tour.routeSummary || [tour.startLocation, tour.endLocation].filter(Boolean).join(" - ") || "Not listed"}</span>
                                <span>
                                  Group: {[tour.groupSizeMin, tour.groupSizeMax].filter(Boolean).join("-") || "Not listed"}
                                </span>
                                <span>Languages: {tour.languages?.join(", ") || "Not listed"}</span>
                                <span>Pickup: {tour.pickupIncluded ? tour.pickupDetails || "Included" : "Not included"}</span>
                                <span>Confirmation: {tour.confirmationType || "Not listed"}</span>
                                <span>Guide included: {tour.guideIncluded === false ? "No" : "Yes"}</span>
                                <span>Customizable: {tour.customizable === false ? "No" : "Yes"}</span>
                                <span>Itinerary days: {tour.itinerary?.length || 0}</span>
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
