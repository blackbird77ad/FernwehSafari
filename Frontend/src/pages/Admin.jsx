import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmActionButton from "../components/ConfirmActionButton";
import PaginatedList from "../components/PaginatedList";
import Spinner from "../components/Spinner";
import ThemeToggle from "../components/ThemeToggle";
import TourListingForm from "../components/TourListingForm";
import Toast from "../components/Toast";
import fallbackTourImage from "../assets/photos/ngorongoro-wide-with-tourists.jpg";
import travellexLogo from "../assets/photos/Travellex-logo-wordmark.png";
import useAuth from "../hooks/useAuth";
import { activityOptions, comfortLevelOptions } from "../utils/travelOptions";
import { getAdminDashboardSummary } from "../services/adminService";
import {
  createPartner,
  deletePartner,
  getPartners,
  rotatePartnerPostbackSecret,
  updatePartner
} from "../services/partnerService";
import {
  deleteTourCompanyApplication,
  getTourCompanyApplications,
  updateTourCompanyApplicationStatus
} from "../services/applicationService";
import {
  decideGuideApplicationByAdmin,
  getGuideApplications,
  getGuideBookings,
  updateGuideBookingStatus
} from "../services/guideService";
import {
  createGalleryMedia,
  deleteGalleryMedia,
  getAdminGalleryMedia,
  reviewGalleryMedia,
  updateGalleryMedia
} from "../services/galleryService";
import {
  createTour,
  deleteTour,
  getTours,
  updateTour
} from "../services/tourService";
import { getEnquiries, updateEnquiryStatus } from "../services/enquiryService";
import { getReferrals, markReferralConverted, reconcileReferralByTrackingCode } from "../services/referralService";
import { getCommissionSettings, updateCommissionSettings } from "../services/settingsService";
import { uploadImage } from "../services/uploadService";
import { apiBaseURL } from "../services/api";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  updateUserSuspension,
  updateUserRole
} from "../services/userService";
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

const userRoles = ["traveller", "tour_company", "tour_guide", "moderator", "admin"];

const roleLabels = {
  traveller: "Traveller",
  tour_company: "Tour company",
  tour_guide: "Tour guide",
  moderator: "Moderator",
  admin: "Admin"
};

const userRoleTabLabels = {
  traveller: "Travelers",
  tour_company: "Partners",
  tour_guide: "Tour Guides",
  moderator: "Moderators",
  admin: "Admin"
};

const referralStatuses = ["clicked", "converted", "paid", "cancelled", "disputed"];
const ADMIN_COLLECTION_PAGE_SIZE = 40;
const ADMIN_USER_PAGE_SIZE = 50;
const ADMIN_USER_PAGE_SIZE_OPTIONS = [50, 100, 200];
const emptyDashboardCounts = {};
const emptyDashboardCommissions = {};
const emptyDashboardSummary = { counts: emptyDashboardCounts, commissions: emptyDashboardCommissions };

function countValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const partnerFieldLabels = {
  name: "Partner name",
  bookingURL: "Default booking URL (optional)",
  location: "Location",
  contactEmail: "Contact email",
  contactPhone: "Contact phone",
  description: "Partner description",
  rating: "Operator rating",
  reviewCount: "Operator reviews",
  licenseInfo: "Licence / trust note",
  logo: "Logo URL",
  commissionRatePercent: "Partner commission % (optional)",
  commissionTerms: "Commission terms"
};

const tabMeta = {
  overview: {
    title: "Dashboard",
    description: "A quick view of tours, users, bookings and work waiting for review."
  },
  commissions: {
    title: "Commission Settings",
    description: "Set the normal commission rate and see how booking payments are tracked."
  },
  referrals: {
    title: "Bookings & Payments",
    description: "Record partner bookings, check payment status and confirm earned commission."
  },
  users: {
    title: "Users",
    description: "Find people, update accounts and manage access."
  },
  "role dashboards": {
    title: "User Overview",
    description: "See what travellers, partners, guides and staff are doing."
  },
  "company applications": {
    title: "Partner Applications",
    description: "Approve or reject companies that want to list tours."
  },
  tours: {
    title: "Tours",
    description: "Edit tour listings, homepage features and public visibility."
  },
  partners: {
    title: "Partners",
    description: "Manage approved tour companies and their booking details."
  },
  "guide applications": {
    title: "Guide Applications",
    description: "Review tour guides connected to partner tours."
  },
  "guide bookings": {
    title: "Guide Bookings",
    description: "Monitor traveller requests sent to tour guides."
  },
  "gallery media": {
    title: "Gallery",
    description: "Approve, schedule, switch off and remove public travel photos."
  },
  enquiries: {
    title: "Enquiries",
    description: "Read and update traveller messages."
  },
  uploads: {
    title: "Media Uploads",
    description: "Upload images for tours and gallery pages."
  }
};

const tabAccentColors = {
  overview: "#2563EB",
  commissions: "#22C55E",
  referrals: "#2563EB",
  users: "#6366F1",
  "role dashboards": "#6366F1",
  "company applications": "#F59E0B",
  tours: "#2563EB",
  partners: "#14B8A6",
  "guide applications": "#F59E0B",
  "guide bookings": "#2563EB",
  "gallery media": "#EC4899",
  enquiries: "#F59E0B",
  uploads: "#0EA5E9"
};

const adminNavIcons = {
  overview: "DB",
  commissions: "CM",
  referrals: "BK",
  users: "US",
  "role dashboards": "RL",
  "company applications": "PA",
  tours: "TR",
  partners: "PT",
  "guide applications": "GA",
  "guide bookings": "GB",
  "gallery media": "GL",
  enquiries: "EN",
  uploads: "UP"
};

const adminTabGroups = [
  { label: "Main", description: "Health and decisions", tabs: ["overview"] },
  { label: "Operations", description: "Tours, bookings, payouts", tabs: ["tours", "guide bookings", "referrals", "commissions"] },
  { label: "People", description: "Partners, customers, access", tabs: ["partners", "users", "role dashboards", "enquiries"] },
  { label: "Content", description: "Gallery and uploads", tabs: ["gallery media", "uploads"] },
  { label: "Applications", description: "Partner and guide reviews", tabs: ["company applications", "guide applications"] }
];

const emptyTour = {
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
  partner: "",
  referralLink: "",
  commissionRatePercent: "",
  images: "",
  inclusions: "",
  exclusions: "",
  availableFrom: "",
  availableTo: "",
  availableWeekdays: "",
  reviewRating: "",
  reviewCount: "",
  vrEnabled: false,
  vrMediaUrl: "",
  vrMediaType: "image",
  vrCaption: "",
  highlights: "",
  itinerary: "",
  featured: false,
  isActive: true
};

const emptyPartner = {
  name: "",
  bookingURL: "",
  location: "",
  contactEmail: "",
  contactPhone: "",
  description: "",
  rating: "",
  reviewCount: "",
  licenseInfo: "",
  logo: "",
  commissionRatePercent: "",
  commissionTerms: "",
  isActive: true
};

const emptyUser = {
  name: "",
  email: "",
  password: "",
  country: "",
  role: "traveller"
};

const emptyGalleryMedia = {
  title: "",
  description: "",
  mediaType: "image",
  url: "",
  thumbnailUrl: "",
  location: "",
  travelDate: "",
  creditName: "",
  creditEmail: "",
  status: "approved",
  isActive: true,
  visibleFrom: "",
  expiresAt: ""
};

const emptyTrackingReconcileForm = {
  trackingCode: "",
  partnerBookingId: "",
  bookingValueEUR: "",
  commissionRatePercent: "",
  commissionEUR: "",
  paidCommissionEUR: "",
  status: "converted",
  notes: ""
};

const emptyCommissionSettings = {
  defaultCommissionRatePercent: "",
  commissionTerms: ""
};

function getEntityId(value) {
  if (!value) {
    return "";
  }

  return String(value._id || value.id || value);
}

function sameEmail(left, right) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function compactList(items, emptyLabel) {
  if (!items.length) {
    return [{ title: emptyLabel, meta: "Nothing needs attention yet." }];
  }

  return items;
}

function sumCurrency(items, field) {
  return items.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}

function statusLabel(status) {
  const labels = {
    clicked: "Booking started",
    converted: "Booking confirmed",
    paid: "Paid",
    cancelled: "Cancelled",
    disputed: "Disputed"
  };

  if (labels[status]) {
    return labels[status];
  }

  return String(status || "not set").replace(/_/g, " ");
}

const enquiryStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "referred", label: "Referred" },
  { value: "closed", label: "Closed" }
];

function enquiryStatusLabel(status) {
  return enquiryStatusOptions.find((option) => option.value === status)?.label || statusLabel(status);
}

function enquirySubject(enquiry) {
  if (enquiry.type === "partner_application") {
    return "Tour listing application";
  }

  return enquiry.tour?.title || enquiry.destination || "General enquiry";
}

function enquiryMessageLines(enquiry) {
  const lines = String(enquiry.message || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length ? lines : ["No message was provided."];
}

const partnerApplicationReviewTabs = [
  { value: "approved", label: "Approved partners" },
  { value: "rejected", label: "Rejected partner applications" }
];

function isReviewedPartnerApplication(application) {
  return ["approved", "rejected"].includes(application.status);
}

function partnerApplicationStatusLabel(status) {
  const labels = {
    new: "Pending partner request",
    submitted: "Pending partner request",
    under_review: "Partner request under review",
    call_scheduled: "Partner call scheduled",
    approved: "Approved partner",
    rejected: "Rejected partner application"
  };

  return labels[status] || statusLabel(status);
}

function emailDeliveryMessage(baseMessage, emailStatus) {
  if (emailStatus && emailStatus.sent === false) {
    return {
      tone: "error",
      message: `${baseMessage} Email notification failed: ${emailStatus.reason || "Check Resend configuration."}`
    };
  }

  if (emailStatus?.sent) {
    return { message: `${baseMessage} Email sent automatically.` };
  }

  return { message: baseMessage };
}

function InfoHint({ text }) {
  return (
    <span className="info-hint" tabIndex="0" aria-label={text}>
      <span aria-hidden="true">i</span>
      <span className="info-hint-bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

function TourManagementMedia({ tour }) {
  const media = normalizeTourMedia(tour.images);
  const firstMedia = media[0] || fallbackTourImage;

  return (
    <div className="management-listing-media">
      {isVideoMedia(firstMedia) ? (
        <video src={firstMedia} muted loop playsInline preload="metadata" />
      ) : (
        <img src={firstMedia} alt={`${tour.title} preview`} loading="lazy" />
      )}
      <span>{media.length ? `${media.length}/${MAX_TOUR_MEDIA_ITEMS} media` : "Add media"}</span>
    </div>
  );
}

function getPathValue(item, path) {
  return String(path)
    .split(".")
    .reduce((value, key) => (value === undefined || value === null ? "" : value[key]), item);
}

function toSearchText(item, searchKeys) {
  return searchKeys
    .map((key) => (typeof key === "function" ? key(item) : getPathValue(item, key)))
    .filter((value) => value !== undefined && value !== null)
    .join(" ")
    .toLowerCase();
}

function compareText(left = "", right = "") {
  return String(left || "").localeCompare(String(right || ""), undefined, { sensitivity: "base" });
}

function compareNumber(left = 0, right = 0) {
  return (Number(left) || 0) - (Number(right) || 0);
}

function compareDateNewest(left, right) {
  return new Date(right || 0).getTime() - new Date(left || 0).getTime();
}

function AdminCollection({
  children,
  className = "admin-list full",
  defaultView = "compact",
  emptyText = "No items found.",
  filterOptions = [],
  gridClassName = "admin-list-grid",
  items = [],
  label = "items",
  pageSize = ADMIN_COLLECTION_PAGE_SIZE,
  searchKeys = [],
  searchPlaceholder = "Search this folder",
  sortOptions = [],
  viewModes = [
    { value: "compact", label: "Compact" },
    { value: "list", label: "List" },
    { value: "cards", label: "Cards" }
  ]
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState(sortOptions[0]?.value || "default");
  const initialView = viewModes.some((mode) => mode.value === defaultView) ? defaultView : viewModes[0]?.value || "list";
  const [view, setView] = useState(initialView);
  const selectedFilter = filterOptions.find((option) => option.value === filter);
  const selectedSort = sortOptions.find((option) => option.value === sort);
  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = !normalizedSearch || toSearchText(item, searchKeys).includes(normalizedSearch);
      const matchesFilter = !selectedFilter?.predicate || selectedFilter.predicate(item);

      return matchesSearch && matchesFilter;
    });
  }, [items, search, searchKeys, selectedFilter]);
  const sortedItems = useMemo(() => {
    const nextItems = [...filteredItems];

    if (selectedSort?.compare) {
      nextItems.sort(selectedSort.compare);
    }

    return nextItems;
  }, [filteredItems, selectedSort]);
  const collectionGridClass = `${gridClassName} view-${view}`;

  return (
    <div className={`${className} admin-collection view-${view}`}>
      <div className="admin-collection-toolbar">
        <label className="field admin-search-field">
          <span>Search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} />
        </label>
        {filterOptions.length > 0 && (
          <label className="field">
            <span>Filter</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All {label}</option>
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {sortOptions.length > 0 && (
          <label className="field">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="admin-view-switch" role="group" aria-label={`${label} view`}>
          {viewModes.map((mode) => (
            <button
              className={view === mode.value ? "active" : ""}
              key={mode.value}
              type="button"
              onClick={() => setView(mode.value)}
              aria-pressed={view === mode.value}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="form-note">
          {sortedItems.length} of {items.length} {label}
        </p>
      </div>
      <PaginatedList className="admin-collection-results" emptyText={emptyText} gridClassName={collectionGridClass} items={sortedItems} label={label} pageSize={pageSize}>
        {(item) => children(item, view)}
      </PaginatedList>
    </div>
  );
}

export default function Admin() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [adminSearch, setAdminSearch] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(emptyDashboardSummary);
  const [users, setUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [partners, setPartners] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [companyApplications, setCompanyApplications] = useState([]);
  const [partnerApplicationReviewTab, setPartnerApplicationReviewTab] = useState("approved");
  const [guideApplications, setGuideApplications] = useState([]);
  const [guideBookings, setGuideBookings] = useState([]);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [tourForm, setTourForm] = useState(emptyTour);
  const [editingTourId, setEditingTourId] = useState("");
  const [tourFormOpen, setTourFormOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState(emptyPartner);
  const [editingPartnerId, setEditingPartnerId] = useState("");
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState("");
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState("");
  const [previewUserId, setPreviewUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSort, setUserSort] = useState("newest");
  const [userView, setUserView] = useState("compact");
  const [userPagination, setUserPagination] = useState({ page: 1, limit: ADMIN_USER_PAGE_SIZE, total: 0, totalPages: 1, roleCounts: {} });
  const [referralForms, setReferralForms] = useState({});
  const [trackingReconcileForm, setTrackingReconcileForm] = useState(emptyTrackingReconcileForm);
  const [commissionSettings, setCommissionSettings] = useState(emptyCommissionSettings);
  const [commissionSettingsForm, setCommissionSettingsForm] = useState(emptyCommissionSettings);
  const [galleryForm, setGalleryForm] = useState(emptyGalleryMedia);
  const [editingGalleryMediaId, setEditingGalleryMediaId] = useState("");
  const [uploading, setUploading] = useState(false);

  const partnerOptions = useMemo(
    () => partners.map((partner) => ({ value: partner._id, label: partner.name })),
    [partners]
  );

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "moderator";
  const dashboardCounts = dashboardSummary.counts || emptyDashboardCounts;
  const dashboardCommissions = dashboardSummary.commissions || emptyDashboardCommissions;

  const tabs = useMemo(
    () => [
      "overview",
      ...(isAdmin ? ["commissions", "referrals", "users", "role dashboards", "company applications"] : []),
      ...(isStaff ? ["tours", "guide applications", "guide bookings", "gallery media"] : []),
      ...(isAdmin ? ["partners", "enquiries"] : []),
      ...(isStaff ? ["uploads"] : [])
    ],
    [isAdmin, isStaff]
  );

  const commissionStats = useMemo(() => {
    const localEstimated = sumCurrency(referrals, "estimatedCommissionEUR");
    const localConfirmed = sumCurrency(referrals, "confirmedCommissionEUR");
    const localPaid = sumCurrency(referrals, "paidCommissionEUR");
    const localConverted = referrals.filter((referral) => referral.converted || ["converted", "paid"].includes(referral.status)).length;
    const localOpen = Math.max(localConfirmed - localPaid, 0);
    const localConversionRate = referrals.length ? Math.round((localConverted / referrals.length) * 100) : 0;

    return {
      estimated: isAdmin ? countValue(dashboardCommissions.estimated, localEstimated) : localEstimated,
      confirmed: isAdmin ? countValue(dashboardCommissions.confirmed, localConfirmed) : localConfirmed,
      paid: isAdmin ? countValue(dashboardCommissions.paid, localPaid) : localPaid,
      open: isAdmin ? countValue(dashboardCommissions.open, localOpen) : localOpen,
      converted: isAdmin ? countValue(dashboardCommissions.converted, localConverted) : localConverted,
      conversionRate: isAdmin ? countValue(dashboardCommissions.conversionRate, localConversionRate) : localConversionRate
    };
  }, [dashboardCommissions, isAdmin, referrals]);

  const tourCommissionOverrideCount = useMemo(
    () => tours.filter((tour) => tour.commissionRatePercent !== undefined && tour.commissionRatePercent !== null && tour.commissionRatePercent !== "").length,
    [tours]
  );

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    return users.filter((item) => {
      const matchesRole = userRoleFilter === "all" || item.role === userRoleFilter;
      const matchesSearch =
        !search ||
        [item.name, item.email, item.country, roleLabels[item.role]]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      return matchesRole && matchesSearch;
    });
  }, [userRoleFilter, userSearch, users]);

  const userSortOptions = useMemo(
    () => [
      { value: "newest", label: "Newest", compare: (left, right) => compareDateNewest(left.createdAt, right.createdAt) },
      { value: "name", label: "Name A-Z", compare: (left, right) => compareText(left.name, right.name) },
      { value: "role", label: "Role", compare: (left, right) => compareText(roleLabels[left.role] || left.role, roleLabels[right.role] || right.role) },
      { value: "country", label: "Country", compare: (left, right) => compareText(left.country, right.country) }
    ],
    []
  );

  const sortedUsers = useMemo(() => {
    const selectedSort = userSortOptions.find((option) => option.value === userSort);
    const nextUsers = [...filteredUsers];

    if (selectedSort?.compare) {
      nextUsers.sort(selectedSort.compare);
    }

    return nextUsers;
  }, [filteredUsers, userSort, userSortOptions]);

  const visibleUsers = sortedUsers;

  const usersByRole = useMemo(
    () =>
      userRoles.map((role) => ({
        role,
        label: userRoleTabLabels[role] || roleLabels[role],
        count: isAdmin ? countValue(dashboardCounts.userRoles?.[role], userPagination.roleCounts?.[role] || 0) : userPagination.roleCounts?.[role] || 0
      })),
    [dashboardCounts.userRoles, isAdmin, userPagination.roleCounts]
  );
  const pendingCompanyApplicationCount = useMemo(
    () =>
      isAdmin
        ? countValue(
            dashboardCounts.pendingCompanyApplications,
            companyApplications.filter((application) => !["approved", "rejected"].includes(application.status)).length
          )
        : companyApplications.filter((application) => !["approved", "rejected"].includes(application.status)).length,
    [companyApplications, dashboardCounts.pendingCompanyApplications, isAdmin]
  );
  const pendingGuideConfirmationCount = useMemo(
    () =>
      isAdmin
        ? countValue(
            dashboardCounts.pendingGuideConfirmations,
            guideApplications.filter((application) => application.status === "company_approved").length
          )
        : guideApplications.filter((application) => application.status === "company_approved").length,
    [dashboardCounts.pendingGuideConfirmations, guideApplications, isAdmin]
  );
  const pendingGalleryCount = useMemo(
    () =>
      isAdmin
        ? countValue(dashboardCounts.pendingGalleryMedia, galleryMedia.filter((item) => item.status === "pending").length)
        : galleryMedia.filter((item) => item.status === "pending").length,
    [dashboardCounts.pendingGalleryMedia, galleryMedia, isAdmin]
  );
  const openEnquiryCount = useMemo(
    () =>
      isAdmin
        ? countValue(dashboardCounts.openEnquiries, enquiries.filter((enquiry) => enquiry.status !== "closed").length)
        : enquiries.filter((enquiry) => enquiry.status !== "closed").length,
    [dashboardCounts.openEnquiries, enquiries, isAdmin]
  );
  const unpaidCommissionCount = useMemo(
    () =>
      isAdmin
        ? countValue(
            dashboardCounts.unpaidCommissions,
            referrals.filter((referral) => Number(referral.confirmedCommissionEUR || 0) > Number(referral.paidCommissionEUR || 0)).length
          )
        : referrals.filter((referral) => Number(referral.confirmedCommissionEUR || 0) > Number(referral.paidCommissionEUR || 0)).length,
    [dashboardCounts.unpaidCommissions, isAdmin, referrals]
  );
  const dashboardActionCount = useMemo(
    () =>
      isAdmin
        ? countValue(
            dashboardCounts.dashboardActions,
            pendingCompanyApplicationCount + pendingGuideConfirmationCount + pendingGalleryCount + openEnquiryCount + unpaidCommissionCount
          )
        : pendingCompanyApplicationCount + pendingGuideConfirmationCount + pendingGalleryCount,
    [
      dashboardCounts.dashboardActions,
      isAdmin,
      openEnquiryCount,
      pendingCompanyApplicationCount,
      pendingGalleryCount,
      pendingGuideConfirmationCount,
      unpaidCommissionCount
    ]
  );
  const totalUserCount = isAdmin ? countValue(dashboardCounts.users, userPagination.total || users.length) : users.length;
  const totalTourCount = isAdmin ? countValue(dashboardCounts.tours, tours.length) : tours.length;
  const totalPartnerCount = isAdmin ? countValue(dashboardCounts.partners, partners.length) : partners.length;
  const totalCompanyApplicationCount = isAdmin
    ? countValue(dashboardCounts.companyApplications, companyApplications.length)
    : companyApplications.length;
  const totalGuideApplicationCount = isAdmin
    ? countValue(dashboardCounts.guideApplications, guideApplications.length)
    : guideApplications.length;
  const totalGuideBookingCount = isAdmin ? countValue(dashboardCounts.guideBookings, guideBookings.length) : guideBookings.length;
  const totalGalleryMediaCount = isAdmin ? countValue(dashboardCounts.galleryMedia, galleryMedia.length) : galleryMedia.length;
  const totalEnquiryCount = isAdmin ? countValue(dashboardCounts.enquiries, enquiries.length) : enquiries.length;
  const totalReferralCount = isAdmin ? countValue(dashboardCounts.referrals, referrals.length) : referrals.length;

  const crmStats = useMemo(
    () => [
      ...(isAdmin ? [{ label: "Users", value: totalUserCount }] : []),
      { label: "Tours", value: totalTourCount },
      { label: "Operators", value: totalPartnerCount },
      ...(isAdmin ? [{ label: "Estimated commission", value: eur.format(commissionStats.estimated) }] : []),
      ...(isAdmin ? [{ label: "Confirmed commission", value: eur.format(commissionStats.confirmed) }] : []),
      ...(isAdmin ? [{ label: "Unpaid commission", value: eur.format(commissionStats.open) }] : []),
      ...(isAdmin
        ? [
            {
              label: "Company applications",
              value: pendingCompanyApplicationCount
            }
          ]
        : []),
      {
        label: "Guide applications",
        value: pendingGuideConfirmationCount
      },
      { label: "Gallery pending", value: pendingGalleryCount },
      ...(isAdmin
        ? [
            { label: "Open enquiries", value: openEnquiryCount },
            { label: "Booking starts", value: totalReferralCount },
            { label: "Converted", value: commissionStats.converted }
          ]
        : [])
    ],
    [
      commissionStats,
      isAdmin,
      openEnquiryCount,
      pendingCompanyApplicationCount,
      pendingGalleryCount,
      pendingGuideConfirmationCount,
      totalPartnerCount,
      totalReferralCount,
      totalTourCount,
      totalUserCount
    ]
  );

  const tabCounts = useMemo(
    () => ({
      overview: dashboardActionCount,
      commissions: unpaidCommissionCount,
      referrals: totalReferralCount,
      users: totalUserCount,
      "role dashboards": totalUserCount,
      "company applications": totalCompanyApplicationCount,
      tours: totalTourCount,
      partners: totalPartnerCount,
      "guide applications": totalGuideApplicationCount,
      "guide bookings": totalGuideBookingCount,
      "gallery media": totalGalleryMediaCount,
      enquiries: totalEnquiryCount,
      uploads: uploading ? 1 : 0
    }),
    [
      dashboardActionCount,
      totalCompanyApplicationCount,
      totalEnquiryCount,
      totalGalleryMediaCount,
      totalGuideApplicationCount,
      totalGuideBookingCount,
      totalPartnerCount,
      totalReferralCount,
      totalTourCount,
      totalUserCount,
      unpaidCommissionCount,
      uploading
    ]
  );

  const availableTabGroups = useMemo(
    () =>
      adminTabGroups
        .map((group) => ({
          ...group,
          tabs: group.tabs.filter((tab) => tabs.includes(tab))
        }))
        .filter((group) => group.tabs.length),
    [tabs]
  );

  const adminSearchMatches = useMemo(() => {
    const search = adminSearch.trim().toLowerCase();

    if (!search) {
      return [];
    }

    return tabs.filter((tab) =>
      [tab, tabMeta[tab]?.title, tabMeta[tab]?.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [adminSearch, tabs]);

  const adminQuickActions = useMemo(
    () =>
      [
        {
          tab: "company applications",
          label: "Review partner requests",
          value: pendingCompanyApplicationCount,
          detail: "waiting"
        },
        {
          tab: "partners",
          label: "Create approved partner",
          value: totalPartnerCount,
          detail: "ready to list"
        },
        {
          tab: "tours",
          label: "Manage public tours",
          value: totalTourCount,
          detail: "listings"
        },
        {
          tab: "referrals",
          label: "Record booking",
          value: eur.format(commissionStats.open),
          detail: "unpaid"
        },
        {
          tab: "users",
          label: "Manage access",
          value: totalUserCount,
          detail: "accounts"
        }
      ].filter((action) => tabs.includes(action.tab)),
    [
      commissionStats.open,
      pendingCompanyApplicationCount,
      tabs,
      totalPartnerCount,
      totalTourCount,
      totalUserCount
    ]
  );

  const adminHealthSignals = useMemo(
    () => [
      {
        label: "Business health",
        value: dashboardActionCount ? `${dashboardActionCount} actions` : "Clear",
        detail: dashboardActionCount ? "needs review" : "no urgent queue",
        tone: dashboardActionCount ? "warning" : "success"
      },
      {
        label: "Tour supply",
        value: totalTourCount,
        detail: `${totalPartnerCount} approved operators`,
        tone: totalTourCount ? "success" : "warning"
      },
      {
        label: "Media quality",
        value: pendingGalleryCount,
        detail: "gallery items pending",
        tone: pendingGalleryCount ? "warning" : "success"
      },
      {
        label: "Revenue guard",
        value: eur.format(commissionStats.open),
        detail: "confirmed but unpaid",
        tone: commissionStats.open ? "warning" : "success"
      }
    ],
    [commissionStats.open, dashboardActionCount, pendingGalleryCount, totalPartnerCount, totalTourCount]
  );

  const pendingCompanyApplicationItems = useMemo(
    () =>
      companyApplications
        .filter((application) => !isReviewedPartnerApplication(application))
        .sort((left, right) => compareDateNewest(left.createdAt, right.createdAt)),
    [companyApplications]
  );
  const reviewedCompanyApplicationItems = useMemo(
    () => companyApplications.filter((application) => application.status === partnerApplicationReviewTab),
    [companyApplications, partnerApplicationReviewTab]
  );
  const partnerApplicationReviewCounts = useMemo(
    () => ({
      approved: isAdmin
        ? countValue(
            dashboardCounts.approvedCompanyApplications,
            companyApplications.filter((application) => application.status === "approved").length
          )
        : companyApplications.filter((application) => application.status === "approved").length,
      rejected: isAdmin
        ? countValue(
            dashboardCounts.rejectedCompanyApplications,
            companyApplications.filter((application) => application.status === "rejected").length
          )
        : companyApplications.filter((application) => application.status === "rejected").length
    }),
    [companyApplications, dashboardCounts.approvedCompanyApplications, dashboardCounts.rejectedCompanyApplications, isAdmin]
  );

  const previewUser = useMemo(() => {
    if (!users.length) {
      return null;
    }

    return users.find((item) => getEntityId(item) === String(previewUserId)) || users[0];
  }, [previewUserId, users]);

  const roleDashboardPreview = useMemo(() => {
    if (!previewUser) {
      return null;
    }

    const id = getEntityId(previewUser);
    const email = previewUser.email || "";
    const savedTours = previewUser.savedTours || [];
    const companyTours = tours.filter((tour) => getEntityId(tour.owner) === id);
    const companyTourIds = new Set(companyTours.map((tour) => getEntityId(tour)));
    const travellerReferrals = referrals.filter((referral) => getEntityId(referral.user) === id);
    const travellerEnquiries = enquiries.filter((enquiry) => sameEmail(enquiry.email, email));
    const travellerBookings = guideBookings.filter(
      (booking) => getEntityId(booking.requester) === id || sameEmail(booking.email, email)
    );
    const guideApplicationsForUser = guideApplications.filter(
      (application) => getEntityId(application.guide) === id || sameEmail(application.email, email)
    );
    const guideBookingsForUser = guideBookings.filter((booking) => getEntityId(booking.guide) === id);
    const companyGuideApplications = guideApplications.filter((application) =>
      companyTourIds.has(getEntityId(application.tour))
    );
    const companyGuideBookings = guideBookings.filter((booking) => companyTourIds.has(getEntityId(booking.tour)));
    const pendingCompanyApplications = companyApplications.filter(
      (application) => !["approved", "rejected"].includes(application.status)
    );
    const pendingGuideConfirmations = guideApplications.filter((application) => application.status === "company_approved");
    const pendingGallery = galleryMedia.filter((item) => item.status === "pending");

    const savedTourItems = savedTours.slice(0, 3).map((tour) => ({
      title: tour.title || "Saved tour",
      meta: `${tour.location || "No location"} - ${tour.duration || "Duration not set"}`
    }));
    const enquiryItems = travellerEnquiries.slice(0, 3).map((enquiry) => ({
      title: enquiry.destination || enquiry.name || "Traveller enquiry",
      meta: `${enquiry.status || "open"} - ${formatDate(enquiry.createdAt)}`
    }));
    const referralItems = travellerReferrals.slice(0, 3).map((referral) => ({
      title: referral.tour?.title || "Booking start",
      meta: `${referral.converted ? "Booking confirmed" : "Booking started"} - ${formatDate(referral.clickedAt)}`
    }));
    const travellerBookingItems = travellerBookings.slice(0, 3).map((booking) => ({
      title: booking.tour?.title || "Guide request",
      meta: `${booking.guide?.name || "Guide"} - ${booking.status}`
    }));
    const companyTourItems = companyTours.slice(0, 3).map((tour) => ({
      title: tour.title || "Company tour",
      meta: `${tour.isActive ? "live" : "pending"} - ${tour.location || "No location"}`
    }));
    const companyGuideItems = companyGuideApplications.slice(0, 3).map((application) => ({
      title: application.guideName || application.guide?.name || "Guide application",
      meta: `${application.tour?.title || "Tour"} - ${application.status}`
    }));
    const companyBookingItems = companyGuideBookings.slice(0, 3).map((booking) => ({
      title: booking.tour?.title || "Guide booking",
      meta: `${booking.name || "Traveller"} - ${booking.status}`
    }));
    const guideApplicationItems = guideApplicationsForUser.slice(0, 3).map((application) => ({
      title: application.tour?.title || "Tour application",
      meta: `${application.status} - ${
        application.dailyRateEUR ? `${eur.format(application.dailyRateEUR)} per day` : "rate not listed"
      }`
    }));
    const guideBookingItems = guideBookingsForUser.slice(0, 3).map((booking) => ({
      title: booking.tour?.title || "Guide booking",
      meta: `${booking.name || "Traveller"} - ${booking.travelDates || "dates not listed"} - ${booking.status}`
    }));
    const moderationItems = [
      ...pendingCompanyApplications.slice(0, 1).map((application) => ({
        title: application.companyName || "Company application",
        meta: `${application.status} - partner review`
      })),
      ...pendingGuideConfirmations.slice(0, 1).map((application) => ({
        title: application.guideName || "Guide confirmation",
        meta: `${application.tour?.title || "Tour"} - staff confirmation`
      })),
      ...pendingGallery.slice(0, 1).map((item) => ({
        title: item.title || "Gallery media",
        meta: `${item.mediaType} - gallery review`
      }))
    ];

    const cardsByRole = {
      traveller: [
        {
          eyebrow: "Saved tours",
          value: savedTours.length,
          note: "Tours this traveller shortlisted.",
          items: compactList(savedTourItems, "No saved tours")
        },
        {
          eyebrow: "Enquiries",
          value: travellerEnquiries.length,
          note: "Messages connected by traveller email.",
          items: compactList(enquiryItems, "No enquiries")
        },
        {
          eyebrow: "Booking activity",
          value: travellerReferrals.length,
          note: "Booking starts from this account.",
          items: compactList(referralItems, "No booking starts")
        },
        {
          eyebrow: "Guide requests",
          value: travellerBookings.length,
          note: "Guide bookings requested by this traveller.",
          items: compactList(travellerBookingItems, "No guide requests")
        }
      ],
      tour_company: [
        {
          eyebrow: "Owned tours",
          value: companyTours.length,
          note: "Listings attached to this partner account.",
          items: compactList(companyTourItems, "No owned tours")
        },
        {
          eyebrow: "Guide applications",
          value: companyGuideApplications.length,
          note: "Guide applications for this company's tours.",
          items: compactList(companyGuideItems, "No guide applications")
        },
        {
          eyebrow: "Guide bookings",
          value: companyGuideBookings.length,
          note: "Traveller guide requests on company tours.",
          items: compactList(companyBookingItems, "No guide bookings")
        },
        {
          eyebrow: "Saved tours",
          value: savedTours.length,
          note: "Any traveller shortlist activity on the account.",
          items: compactList(savedTourItems, "No saved tours")
        }
      ],
      tour_guide: [
        {
          eyebrow: "Guide applications",
          value: guideApplicationsForUser.length,
          note: "Tours this guide applied to work on.",
          items: compactList(guideApplicationItems, "No guide applications")
        },
        {
          eyebrow: "Booking requests",
          value: guideBookingsForUser.length,
          note: "Traveller requests for this guide.",
          items: compactList(guideBookingItems, "No booking requests")
        },
        {
          eyebrow: "Saved tours",
          value: savedTours.length,
          note: "Tours this guide has shortlisted.",
          items: compactList(savedTourItems, "No saved tours")
        }
      ],
      moderator: [
        {
          eyebrow: "Moderation queue",
          value: pendingCompanyApplications.length + pendingGuideConfirmations.length + pendingGallery.length,
          note: "Pending review work this role can help manage.",
          items: compactList(moderationItems, "Nothing pending")
        },
        {
          eyebrow: "Gallery pending",
          value: pendingGallery.length,
          note: "Media waiting for review.",
          items: compactList(
            pendingGallery.slice(0, 3).map((item) => ({
              title: item.title || "Gallery media",
              meta: `${item.mediaType} - ${item.location || "No location"}`
            })),
            "No pending media"
          )
        },
        {
          eyebrow: "Guide confirmations",
          value: pendingGuideConfirmations.length,
          note: "Company-approved guides awaiting staff confirmation.",
          items: compactList(
            pendingGuideConfirmations.slice(0, 3).map((application) => ({
              title: application.guideName || "Guide application",
              meta: application.tour?.title || "Tour"
            })),
            "No guide confirmations"
          )
        }
      ],
      admin: [
        {
          eyebrow: "Full CRM",
          value: totalUserCount,
          note: "Users available for role management.",
          items: compactList(
            users.slice(0, 3).map((item) => ({
              title: item.name,
              meta: `${roleLabels[item.role] || item.role} - ${item.email}`
            })),
            "No users"
          )
        },
        {
          eyebrow: "Moderation queue",
          value: pendingCompanyApplications.length + pendingGuideConfirmations.length + pendingGallery.length,
          note: "Pending partner, guide and gallery review.",
          items: compactList(moderationItems, "Nothing pending")
        },
        {
          eyebrow: "Booking starts",
          value: totalReferralCount,
          note: "All booking starts sent through Travellex.",
          items: compactList(
            referrals.slice(0, 3).map((referral) => ({
              title: referral.tour?.title || "Booking start",
              meta: `${referral.user?.email || "Guest"} - ${referral.converted ? "Booking confirmed" : "Open"}`
            })),
            "No bookings"
          )
        }
      ]
    };

    return {
      cards: cardsByRole[previewUser.role] || cardsByRole.traveller
    };
  }, [
    companyApplications,
    enquiries,
    galleryMedia,
    guideApplications,
    guideBookings,
    previewUser,
    referrals,
    tours,
    totalReferralCount,
    totalUserCount,
    users
  ]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [tourResponse, partnerResponse, galleryMediaResponse, guideApplicationResponse, guideBookingResponse] =
        await Promise.all([
          getTours({ includeInactive: true }),
          getPartners({ includeInactive: true }),
          getAdminGalleryMedia(),
          getGuideApplications(),
          getGuideBookings()
        ]);

      setTours(tourResponse.data.tours);
      setPartners(partnerResponse.data.partners);
      setGuideApplications(guideApplicationResponse.data.applications);
      setGuideBookings(guideBookingResponse.data.bookings);
      setGalleryMedia(galleryMediaResponse.data.media);

      if (isAdmin) {
        const [
          userResponse,
          enquiryResponse,
          referralResponse,
          companyApplicationResponse,
          commissionSettingsResponse,
          dashboardSummaryResponse
        ] = await Promise.all([
          getUsers({ limit: ADMIN_USER_PAGE_SIZE, page: 1 }),
          getEnquiries(),
          getReferrals(),
          getTourCompanyApplications(),
          getCommissionSettings(),
          getAdminDashboardSummary()
        ]);
        const nextCommissionSettings = commissionSettingsResponse.data.settings || emptyCommissionSettings;
        const nextDashboardSummary = dashboardSummaryResponse.data || emptyDashboardSummary;
        const nextDashboardCounts = nextDashboardSummary.counts || {};
        const nextUserPagination = userResponse.data.pagination || {
          page: 1,
          limit: ADMIN_USER_PAGE_SIZE,
          total: userResponse.data.users.length,
          totalPages: 1
        };

        setDashboardSummary(nextDashboardSummary);
        setUsers(userResponse.data.users);
        setUserPagination({
          ...nextUserPagination,
          total: countValue(nextDashboardCounts.users, nextUserPagination.total),
          roleCounts: nextDashboardCounts.userRoles || userResponse.data.roleCounts || {}
        });
        setEnquiries(enquiryResponse.data.enquiries);
        setReferrals(referralResponse.data.referrals);
        setCompanyApplications(companyApplicationResponse.data.applications);
        setCommissionSettings(nextCommissionSettings);
        setCommissionSettingsForm({
          defaultCommissionRatePercent: nextCommissionSettings.defaultCommissionRatePercent ?? "",
          commissionTerms: nextCommissionSettings.commissionTerms || ""
        });
      } else {
        setDashboardSummary(emptyDashboardSummary);
        setUsers([]);
        setUserPagination({ page: 1, limit: ADMIN_USER_PAGE_SIZE, total: 0, totalPages: 1, roleCounts: {} });
        setEnquiries([]);
        setReferrals([]);
        setCompanyApplications([]);
        setCommissionSettings(emptyCommissionSettings);
        setCommissionSettingsForm(emptyCommissionSettings);
      }
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  async function loadUsersForFilters(page = 1, overrides = {}) {
    const search = overrides.search ?? userSearch;
    const role = overrides.role ?? userRoleFilter;
    const limit = Number(overrides.limit ?? userPagination.limit ?? ADMIN_USER_PAGE_SIZE);
    const params = {
      limit,
      page
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (role !== "all") {
      params.role = role;
    }

    try {
      const response = await getUsers(params);
      setUsers(response.data.users);
      setUserPagination({
        ...(response.data.pagination || { page, limit: params.limit, total: response.data.users.length, totalPages: 1 }),
        roleCounts: response.data.roleCounts || userPagination.roleCounts || {}
      });
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  function updateTourField(field, value) {
    setTourForm((current) => ({ ...current, [field]: value }));
  }

  function updatePartnerField(field, value) {
    setPartnerForm((current) => ({ ...current, [field]: value }));
  }

  function updateUserField(field, value) {
    setUserForm((current) => ({ ...current, [field]: value }));
  }

  function updateGalleryField(field, value) {
    setGalleryForm((current) => ({ ...current, [field]: value }));
  }

  function serializeGalleryForm() {
    return {
      ...galleryForm,
      visibleFrom: galleryForm.visibleFrom || undefined,
      expiresAt: galleryForm.expiresAt || undefined
    };
  }

  function serializeUserForm() {
    const payload = {
      name: userForm.name,
      email: userForm.email,
      country: userForm.country,
      role: userForm.role
    };

    if (userForm.password) {
      payload.password = userForm.password;
    }

    return payload;
  }

  function serializePartnerForm() {
    return {
      ...partnerForm,
      commissionRatePercent:
        partnerForm.commissionRatePercent === "" ? undefined : Number(partnerForm.commissionRatePercent),
      rating: partnerForm.rating === "" ? 0 : Number(partnerForm.rating),
      reviewCount: partnerForm.reviewCount === "" ? 0 : Number(partnerForm.reviewCount)
    };
  }

  function serializeTourForm() {
    const payload = {
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
      commissionRatePercent:
        tourForm.commissionRatePercent === "" ? undefined : Number(tourForm.commissionRatePercent),
      images: normalizeTourMedia(tourForm.images),
      highlights: splitLines(tourForm.highlights),
      inclusions: splitLines(tourForm.inclusions),
      exclusions: splitLines(tourForm.exclusions),
      itinerary: parseItineraryText(tourForm.itinerary),
      availableFrom: tourForm.availableFrom || undefined,
      availableTo: tourForm.availableTo || undefined,
      reviewRating: tourForm.reviewRating === "" ? 0 : Number(tourForm.reviewRating),
      reviewCount: tourForm.reviewCount === "" ? 0 : Number(tourForm.reviewCount)
    };

    if (!isAdmin) {
      delete payload.vrEnabled;
      delete payload.vrMediaUrl;
      delete payload.vrMediaType;
      delete payload.vrCaption;
    }

    return payload;
  }

  async function handleTourSubmit(event) {
    event.preventDefault();

    if (isTourMediaLimitExceeded(tourForm.images)) {
      setToast({ tone: "error", message: `Tours can include up to ${MAX_TOUR_MEDIA_ITEMS} images or videos.` });
      return;
    }

    try {
      if (editingTourId) {
        await updateTour(editingTourId, serializeTourForm());
        setToast({ message: "Tour updated." });
      } else {
        await createTour(serializeTourForm());
        setToast({ message: "Tour created." });
      }

      setTourForm(emptyTour);
      setEditingTourId("");
      setTourFormOpen(false);
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  function editTour(tour) {
    setEditingTourId(tour._id);
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
      partner: tour.partner?._id || tour.partner || "",
      referralLink: tour.referralLink || "",
      commissionRatePercent: tour.commissionRatePercent ?? "",
      images: formatTourMediaText(tour.images),
      inclusions: formatListText(tour.inclusions),
      exclusions: formatListText(tour.exclusions),
      availableFrom: tour.availableFrom ? tour.availableFrom.slice(0, 10) : "",
      availableTo: tour.availableTo ? tour.availableTo.slice(0, 10) : "",
      availableWeekdays: formatListText(tour.availableWeekdays),
      reviewRating: tour.reviewRating ?? "",
      reviewCount: tour.reviewCount ?? "",
      vrEnabled: Boolean(tour.vrEnabled),
      vrMediaUrl: tour.vrMediaUrl || "",
      vrMediaType: tour.vrMediaType || "image",
      vrCaption: tour.vrCaption || "",
      highlights: formatListText(tour.highlights),
      itinerary: formatItineraryText(tour.itinerary),
      featured: Boolean(tour.featured),
      isActive: Boolean(tour.isActive)
    });
    setTourFormOpen(true);
    setActiveTab("tours");
  }

  async function removeTour(id) {
    try {
      await deleteTour(id);
      setToast({ message: "Tour deleted." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleTourQuickToggle(id, field, checked) {
    try {
      const response = await updateTour(id, { [field]: checked });
      const updatedTour = response.data.tour;

      setTours((current) => current.map((tour) => (tour._id === id ? { ...tour, ...updatedTour } : tour)));
      setToast({ message: `${field === "featured" ? "Homepage featured" : "Public listing"} ${checked ? "enabled" : "disabled"}.` });
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handlePartnerSubmit(event) {
    event.preventDefault();

    try {
      if (editingPartnerId) {
        await updatePartner(editingPartnerId, serializePartnerForm());
        setToast({ message: "Partner updated." });
      } else {
        const response = await createPartner(serializePartnerForm());
        const baseMessage = response.data.accountCreated
          ? "Partner created, approved, and dashboard account created."
          : "Partner created and existing account approved.";

        setToast(emailDeliveryMessage(baseMessage, response.data.emailStatus));
      }

      setPartnerForm(emptyPartner);
      setEditingPartnerId("");
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  function editPartner(partner) {
    setEditingPartnerId(partner._id);
    setPartnerForm({
      name: partner.name || "",
      bookingURL: partner.bookingURL || "",
      location: partner.location || "",
      contactEmail: partner.contactEmail || "",
      contactPhone: partner.contactPhone || "",
      description: partner.description || "",
      rating: partner.rating ?? "",
      reviewCount: partner.reviewCount ?? "",
      licenseInfo: partner.licenseInfo || "",
      logo: partner.logo || "",
      commissionRatePercent: partner.commissionRatePercent ?? "",
      commissionTerms: partner.commissionTerms || "",
      isActive: Boolean(partner.isActive)
    });
    setActiveTab("partners");
  }

  async function removePartner(id) {
    try {
      await deletePartner(id);
      setToast({ message: "Partner deleted." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleUserSubmit(event) {
    event.preventDefault();

    try {
      if (editingUserId) {
        await updateUser(editingUserId, serializeUserForm());
        setToast({ message: "User updated." });
      } else {
        await createUser(serializeUserForm());
        setToast({ message: "User created." });
      }

      setUserForm(emptyUser);
      setEditingUserId("");
      setUserFormOpen(false);
      await loadUsersForFilters(1);
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleGallerySubmit(event) {
    event.preventDefault();

    try {
      if (editingGalleryMediaId) {
        await updateGalleryMedia(editingGalleryMediaId, serializeGalleryForm());
        setToast({ message: "Gallery media updated." });
      } else {
        await createGalleryMedia(serializeGalleryForm());
        setToast({ message: "Gallery media created." });
      }

      setGalleryForm(emptyGalleryMedia);
      setEditingGalleryMediaId("");
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  function editGalleryMedia(item) {
    setEditingGalleryMediaId(item._id);
    setGalleryForm({
      title: item.title || "",
      description: item.description || "",
      mediaType: item.mediaType || "image",
      url: item.url || "",
      thumbnailUrl: item.thumbnailUrl || "",
      location: item.location || "",
      travelDate: item.travelDate || "",
      creditName: item.creditName || "",
      creditEmail: item.creditEmail || "",
      status: item.status || "approved",
      isActive: Boolean(item.isActive),
      visibleFrom: item.visibleFrom ? item.visibleFrom.slice(0, 16) : "",
      expiresAt: item.expiresAt ? item.expiresAt.slice(0, 16) : ""
    });
    setActiveTab("gallery media");
  }

  async function handleGalleryReview(id, status) {
    try {
      const response = await reviewGalleryMedia(id, { status, reviewNotes: "" });
      setToast(emailDeliveryMessage(`Gallery media ${status}.`, response.data.emailStatus));
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function removeGalleryMedia(id) {
    try {
      await deleteGalleryMedia(id);
      setToast({ message: "Gallery media deleted." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  function editUser(user) {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      country: user.country || "",
      role: user.role || "traveller"
    });
    setUserFormOpen(true);
    setActiveTab("users");
  }

  async function handleUserRoleChange(id, role) {
    try {
      await updateUserRole(id, role);
      setToast({ message: "User role updated." });
      await loadUsersForFilters(1);
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleUserSuspension(id, suspended) {
    try {
      await updateUserSuspension(id, suspended);
      setToast({ message: `User ${suspended ? "suspended" : "activated"}.` });
      await loadUsersForFilters(userPagination.page);
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function removeUser(id) {
    try {
      await deleteUser(id);
      setToast({ message: "User deleted." });
      await loadUsersForFilters(userPagination.page);
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateEnquiryStatus(id, status);
      setToast({ message: "Enquiry updated." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleReferralConversion(id) {
    const payload = {
      status: "converted",
      ...(referralForms[id] || {})
    };

    try {
      await markReferralConverted(id, payload);
      setToast({ message: "Booking commission updated." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  function updateReferralField(id, field, value) {
    setReferralForms((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [field]: value
      }
    }));
  }

  function referralField(referral, field) {
    const draft = referralForms[referral._id] || {};
    if (draft[field] !== undefined) {
      return draft[field];
    }

    return referral[field] ?? "";
  }

  function updateTrackingReconcileField(field, value) {
    setTrackingReconcileForm((current) => ({ ...current, [field]: value }));
  }

  function updateCommissionSettingsField(field, value) {
    setCommissionSettingsForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCommissionSettingsSubmit(event) {
    event.preventDefault();

    try {
      const response = await updateCommissionSettings({
        defaultCommissionRatePercent:
          commissionSettingsForm.defaultCommissionRatePercent === "" ? 0 : Number(commissionSettingsForm.defaultCommissionRatePercent),
        commissionTerms: commissionSettingsForm.commissionTerms
      });
      const nextSettings = response.data.settings || emptyCommissionSettings;

      setCommissionSettings(nextSettings);
      setCommissionSettingsForm({
        defaultCommissionRatePercent: nextSettings.defaultCommissionRatePercent ?? "",
        commissionTerms: nextSettings.commissionTerms || ""
      });
      setToast({
        message: `Default commission saved. ${response.data.partnersUpdated || 0} partner account${response.data.partnersUpdated === 1 ? "" : "s"} updated.`
      });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleTrackingReconcileSubmit(event) {
    event.preventDefault();

    try {
      const { trackingCode, ...payload } = trackingReconcileForm;
      await reconcileReferralByTrackingCode(trackingCode, payload);
      setTrackingReconcileForm(emptyTrackingReconcileForm);
      setToast({ message: "Booking saved." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function rotatePartnerSecret(id) {
    if (!window.confirm("Reset this partner booking-report key? Their old automatic setup key will stop working.")) {
      return;
    }

    try {
      await rotatePartnerPostbackSecret(id);
      setToast({ message: "Partner booking-report key reset." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleCompanyApplicationStatus(id, status) {
    try {
      const response = await updateTourCompanyApplicationStatus(id, { status, reviewNotes: "" });
      setToast(emailDeliveryMessage(`Company application ${status}.`, response.data.emailStatus));
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function removeCompanyApplication(id) {
    try {
      await deleteTourCompanyApplication(id);
      setToast({ message: "Company application deleted." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleGuideAdminDecision(id, decision) {
    try {
      const response = await decideGuideApplicationByAdmin(id, { decision, notes: "" });
      setToast(emailDeliveryMessage(`Guide application ${decision}.`, response.data.emailStatus));
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleGuideBookingStatus(id, status) {
    try {
      await updateGuideBookingStatus(id, status);
      setToast({ message: "Guide booking updated." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (splitTourMedia(tourForm.images).length >= MAX_TOUR_MEDIA_ITEMS) {
      setToast({ tone: "error", message: `This tour already has ${MAX_TOUR_MEDIA_ITEMS} media items.` });
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const response = await uploadImage(file);
      setTourForm((current) => ({
        ...current,
        images: appendTourMedia(current.images, response.data.url)
      }));
      setToast({ message: "Media uploaded and added to the tour form." });
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    } finally {
      setUploading(false);
    }
  }

  function handleAdminLogout() {
    logout();
    navigate("/");
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setSidebarOpen(false);
    setProfileMenuOpen(false);
  }

  function toggleAdminSidebar() {
    const isDesktopLayout = typeof window !== "undefined" && window.matchMedia("(min-width: 1161px)").matches;

    if (isDesktopLayout) {
      setDesktopSidebarOpen((current) => !current);
      return;
    }

    setSidebarOpen((current) => !current);
  }

  function handleAdminSearchSubmit(event) {
    event.preventDefault();

    if (adminSearchMatches[0]) {
      handleTabChange(adminSearchMatches[0]);
    }
  }

  function renderCompanyApplicationRow(application, { canReview = false } = {}) {
    const currentStatus = application.status || "new";
    const displayStatus = partnerApplicationStatusLabel(currentStatus);
    const notes = application.reviewNotes || application.notes || "No notes provided.";

    return (
      <article className="admin-row partner-application-row" key={application._id}>
        <div>
          <div className="partner-application-title-row">
            <strong>{application.companyName}</strong>
            <span className={`partner-application-status partner-application-status-${currentStatus}`}>
              {displayStatus}
            </span>
          </div>
          <span>
            {application.contactName} - {application.email}
          </span>
          <div className="partner-application-detail-grid">
            <span>
              <strong>Phone</strong>
              {application.phone || "Not provided"}
            </span>
            <span>
              <strong>WhatsApp</strong>
              {application.whatsapp || "Not provided"}
            </span>
            <span>
              <strong>Location</strong>
              {application.headquarters || "Not provided"}
            </span>
            <span>
              <strong>Regions</strong>
              {application.operatingRegions?.join(", ") || "Not provided"}
            </span>
            <span>
              <strong>Has in-house guides</strong>
              {application.hasInHouseGuides ? "Yes" : "No"}
            </span>
          </div>
          <p>{notes}</p>
        </div>
        <div className="button-row">
          <a className="button secondary compact" href={`mailto:${application.email}`}>
            Manual email
          </a>
          {application.phone && (
            <a className="button secondary compact" href={`tel:${application.phone}`}>
              Call
            </a>
          )}
          {application.whatsapp && (
            <a
              className="button secondary compact"
              href={`https://wa.me/${application.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          )}
          {canReview && currentStatus !== "under_review" && (
            <button
              className="button secondary compact"
              type="button"
              onClick={() => handleCompanyApplicationStatus(application._id, "under_review")}
            >
              Under review & email
            </button>
          )}
          {canReview && currentStatus !== "call_scheduled" && (
            <button
              className="button secondary compact"
              type="button"
              onClick={() => handleCompanyApplicationStatus(application._id, "call_scheduled")}
            >
              Call scheduled & email
            </button>
          )}
          {canReview && (
            <>
              <button
                className="button primary compact"
                type="button"
                onClick={() => handleCompanyApplicationStatus(application._id, "approved")}
              >
                Approve & email
              </button>
              <button
                className="button danger compact"
                type="button"
                onClick={() => handleCompanyApplicationStatus(application._id, "rejected")}
              >
                Reject & email
              </button>
            </>
          )}
          <ConfirmActionButton
            actionLabel={`Delete ${application.companyName} application`}
            confirmMessage={`Delete ${application.companyName}'s company application? This cannot be undone.`}
            iconOnly
            onConfirm={() => removeCompanyApplication(application._id)}
          />
        </div>
      </article>
    );
  }

  const activeMeta = tabMeta[activeTab] || { title: activeTab, description: "Manage Travellex." };
  const adminConsoleClass = [
    "admin-console",
    sidebarOpen ? "sidebar-open" : "sidebar-collapsed",
    desktopSidebarOpen ? "sidebar-desktop-open" : "sidebar-desktop-closed"
  ].join(" ");
  const isDesktopSidebarLayout = typeof window !== "undefined" && window.matchMedia("(min-width: 1161px)").matches;
  const sidebarToggleExpanded = isDesktopSidebarLayout ? desktopSidebarOpen : sidebarOpen;

  return (
    <section className={adminConsoleClass}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <Link className="admin-brand" to="/">
            <img className="brand-logo admin-brand-logo" src={travellexLogo} alt="Travellex" />
            <span>
              <small>Admin dashboard</small>
            </span>
          </Link>
          <button
            className="admin-sidebar-toggle sidebar-inner-toggle"
            type="button"
            aria-label={sidebarToggleExpanded ? "Close admin sidebar" : "Open admin sidebar"}
            aria-expanded={sidebarToggleExpanded}
            onClick={toggleAdminSidebar}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div className="admin-identity">
          <span className="admin-avatar">{user?.name?.slice(0, 1) || "A"}</span>
          <div>
            <strong>{user?.name || "Admin"}</strong>
            <small>{roleLabels[user?.role] || "Staff"}</small>
          </div>
        </div>
        <nav className="admin-console-nav" aria-label="Admin workspace navigation">
          {availableTabGroups.map((group) => (
            <details className="admin-nav-group" key={group.label} open={group.label === "Main" || group.tabs.includes(activeTab)}>
              <summary>
                <span>{group.label}</span>
                <small>{group.description}</small>
              </summary>
              <div className="admin-nav-group-items">
                {group.tabs.map((tab) => (
                  <button
                    className={activeTab === tab ? "active" : ""}
                    key={tab}
                    type="button"
                    style={{ "--tab-accent": tabAccentColors[tab] || "var(--admin-accent)" }}
                    onClick={() => handleTabChange(tab)}
                    aria-current={activeTab === tab ? "page" : undefined}
                  >
                    <span className="admin-nav-icon" aria-hidden="true">
                      {adminNavIcons[tab] || "AD"}
                    </span>
                    <span className="admin-nav-copy">
                      <strong>{tabMeta[tab]?.title || tab}</strong>
                      <small>{tabMeta[tab]?.description || "Manage admin records."}</small>
                    </span>
                    <span className="admin-nav-count">{tabCounts[tab] ?? 0}</span>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </nav>
        <div className="admin-sidebar-card">
          <p className="eyebrow">Commission guard</p>
          <strong>{eur.format(commissionStats.open)}</strong>
          <span>confirmed but unpaid</span>
        </div>
        <button className="button secondary compact admin-logout-button" type="button" onClick={handleAdminLogout}>
          Logout
        </button>
      </aside>
      {sidebarOpen && (
        <button
          className="admin-sidebar-backdrop"
          type="button"
          aria-label="Close admin sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <section className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-sidebar-toggle"
              type="button"
              aria-label={sidebarToggleExpanded ? "Close admin sidebar" : "Open admin sidebar"}
              aria-expanded={sidebarToggleExpanded}
              onClick={toggleAdminSidebar}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="admin-breadcrumb" aria-label="Admin breadcrumb">
              <span>Admin</span>
              <span>/</span>
              <strong>{activeMeta.title}</strong>
            </div>
          </div>
          <form className="admin-global-search" onSubmit={handleAdminSearchSubmit}>
            <label className="sr-only" htmlFor="admin-global-search">
              Search admin modules
            </label>
            <input
              id="admin-global-search"
              type="search"
              value={adminSearch}
              onChange={(event) => setAdminSearch(event.target.value)}
              placeholder="Search modules, tours, users..."
            />
            {adminSearch && (
              <span className="admin-search-count">
                {adminSearchMatches.length ? `${adminSearchMatches.length} module${adminSearchMatches.length === 1 ? "" : "s"}` : "No matches"}
              </span>
            )}
          </form>
          <div className="admin-topbar-actions">
            <ThemeToggle compact />
            <button className="admin-icon-button" type="button" title="Notifications" aria-label="Notifications" onClick={() => handleTabChange("overview")}>
              <span aria-hidden="true">N</span>
            </button>
            {tabs.includes("enquiries") && (
              <button className="admin-icon-button" type="button" title="Messages" aria-label="Messages" onClick={() => handleTabChange("enquiries")}>
                <span aria-hidden="true">M</span>
              </button>
            )}
            <button
              className="admin-icon-button"
              type="button"
              title="Help"
              aria-label="Help"
              onClick={() => setToast({ message: "Use the info markers across admin screens for field and workflow guidance." })}
            >
              <span aria-hidden="true">?</span>
            </button>
            <div className="admin-profile-menu-wrap">
              <button
                className="admin-profile-button"
                type="button"
                aria-label="Open admin profile"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((current) => !current)}
              >
                <span className="admin-avatar">{user?.name?.slice(0, 1) || "A"}</span>
                <span>
                  <strong>{user?.name || "Admin"}</strong>
                  <small>{roleLabels[user?.role] || "Staff"}</small>
                </span>
              </button>
              {profileMenuOpen && (
                <div className="admin-profile-menu" role="menu">
                  <div>
                    <strong>{user?.name || "Admin"}</strong>
                    <span>{user?.email || roleLabels[user?.role] || "Staff"}</span>
                  </div>
                  <Link to="/" role="menuitem" onClick={() => setProfileMenuOpen(false)}>
                    Public site
                  </Link>
                  <button type="button" role="menuitem" onClick={handleAdminLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <section className="admin-page-header">
          <div>
            <p className="eyebrow">Travellex admin</p>
            <div className="admin-page-title-row">
              <h1>{activeMeta.title}</h1>
              <InfoHint text={`${activeMeta.title}: ${activeMeta.description}`} />
            </div>
            <span>{activeMeta.description}</span>
          </div>
          <div className="admin-page-actions">
            <Link className="button secondary compact" to="/">
              View public site
            </Link>
          </div>
        </section>
        <div className="admin-command-strip" aria-label="Admin quick actions">
          {adminQuickActions.map((action) => (
            <button
              className={activeTab === action.tab ? "active" : ""}
              key={action.tab}
              type="button"
              style={{ "--tab-accent": tabAccentColors[action.tab] || "var(--admin-accent)" }}
              onClick={() => handleTabChange(action.tab)}
            >
              <span>{action.label}</span>
              <strong>{action.value}</strong>
              <small>{action.detail}</small>
            </button>
          ))}
        </div>
        <div className="admin-workspace-content">
        {loading ? (
          <Spinner />
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="admin-list full">
                <div className="admin-kpi-grid">
                  {crmStats.map((item) => (
                    <article className="admin-kpi-card" key={item.label}>
                      <p className="eyebrow">{item.label}</p>
                      <h2>{item.value}</h2>
                    </article>
                  ))}
                </div>
                <div className="admin-analytics-grid">
                  <article className="side-panel commission-panel">
                    <p className="eyebrow">Commission pipeline</p>
                    <h2>{eur.format(commissionStats.confirmed)} confirmed</h2>
                    <div className="commission-meter">
                      <span style={{ width: `${Math.min(100, commissionStats.conversionRate)}%` }} />
                    </div>
                    <div className="admin-metric-row">
                      <span>Estimated</span>
                      <strong>{eur.format(commissionStats.estimated)}</strong>
                    </div>
                    <div className="admin-metric-row">
                      <span>Paid</span>
                      <strong>{eur.format(commissionStats.paid)}</strong>
                    </div>
                    <div className="admin-metric-row">
                      <span>Conversion rate</span>
                      <strong>{commissionStats.conversionRate}%</strong>
                    </div>
                  </article>
                  <article className="side-panel">
                    <p className="eyebrow">User roles</p>
                    <h2>Access control at a glance.</h2>
                    <div className="role-stat-list">
                      {usersByRole.map((item) => (
                        <button
                          className={userRoleFilter === item.role ? "active" : ""}
                          key={item.role}
                          type="button"
                          onClick={() => {
                            setUserRoleFilter(item.role);
                            setActiveTab("users");
                            loadUsersForFilters(1, { role: item.role });
                          }}
                        >
                          <span>{item.label}</span>
                          <strong>{item.count}</strong>
                        </button>
                      ))}
                    </div>
                  </article>
                  <article className="side-panel">
                    <p className="eyebrow">Review queues</p>
                    <h2>Work that protects quality.</h2>
                    <div className="admin-metric-row">
                      <span>Partner applications</span>
                      <strong>{pendingCompanyApplicationCount}</strong>
                    </div>
                    <div className="admin-metric-row">
                      <span>Guide confirmations</span>
                      <strong>{pendingGuideConfirmationCount}</strong>
                    </div>
                    <div className="admin-metric-row">
                      <span>Gallery pending</span>
                      <strong>{pendingGalleryCount}</strong>
                    </div>
                  </article>
                </div>
                <div className="side-panel">
                  <p className="eyebrow">Booking tracking</p>
                  <h2>Every booking click gets a Travellex booking code.</h2>
                  <p>
                    When a traveller starts booking, Travellex creates a code for that enquiry. If the partner website
                    sends the booking result back, the commission updates automatically. If not, use Bookings & Payments
                    to enter the booking from the partner report.
                  </p>
                </div>
                <div className="admin-dashboard-widgets">
                  <article className="side-panel admin-system-panel">
                    <p className="eyebrow">System status</p>
                    <h2>What needs attention now.</h2>
                    <div className="admin-system-list">
                      {adminHealthSignals.map((signal) => (
                        <button
                          className={`admin-system-item tone-${signal.tone}`}
                          key={signal.label}
                          type="button"
                          onClick={() => {
                            if (signal.label === "Business health") {
                              handleTabChange(dashboardActionCount ? "company applications" : "overview");
                            } else if (signal.label === "Tour supply") {
                              handleTabChange("tours");
                            } else if (signal.label === "Media quality") {
                              handleTabChange("gallery media");
                            } else if (signal.label === "Revenue guard") {
                              handleTabChange("commissions");
                            }
                          }}
                        >
                          <span>
                            <strong>{signal.label}</strong>
                            <small>{signal.detail}</small>
                          </span>
                          <b>{signal.value}</b>
                        </button>
                      ))}
                    </div>
                  </article>
                  <article className="side-panel admin-flow-panel">
                    <p className="eyebrow">Fast workflows</p>
                    <h2>Keep the marketplace moving.</h2>
                    <div className="plain-help-list">
                      <button type="button" onClick={() => handleTabChange("partners")}>
                        <strong>1</strong>
                        Create an approved partner account.
                      </button>
                      <button type="button" onClick={() => handleTabChange("tours")}>
                        <strong>2</strong>
                        Add up to {MAX_TOUR_MEDIA_ITEMS} polished tour media items.
                      </button>
                      <button type="button" onClick={() => handleTabChange("gallery media")}>
                        <strong>3</strong>
                        Review gallery assets before they go public.
                      </button>
                    </div>
                  </article>
                </div>
              </div>
            )}
            {activeTab === "commissions" && (
              <div className="admin-list full">
                <div className="commission-settings-grid">
                  <form className="panel-form commission-settings-panel" onSubmit={handleCommissionSettingsSubmit}>
                    <div>
                      <p className="eyebrow">Normal commission</p>
                      <h2>Set the default Travellex commission.</h2>
                      <p>
                        This rate is used for partner tours unless a specific tour has its own commission rate. Saving
                        here also updates the default rate on partner accounts.
                      </p>
                    </div>
                    <div className="commission-default-control">
                      <label className="field">
                        <span>Default commission %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={commissionSettingsForm.defaultCommissionRatePercent}
                          onChange={(event) => updateCommissionSettingsField("defaultCommissionRatePercent", event.target.value)}
                        />
                      </label>
                      <button className="button primary" type="submit">
                        Save default commission
                      </button>
                    </div>
                    <label className="field">
                      <span>Commission note for the team</span>
                      <textarea
                        value={commissionSettingsForm.commissionTerms}
                        onChange={(event) => updateCommissionSettingsField("commissionTerms", event.target.value)}
                        placeholder="Example: Commission is calculated on confirmed booking value before payouts."
                      />
                    </label>
                  </form>

                  <article className="side-panel commission-explain-panel">
                    <p className="eyebrow">How it works</p>
                    <h2>Automatic when partners report back.</h2>
                    <div className="plain-help-list">
                      <span>
                        <strong>1</strong>
                        Traveller clicks Book with Travellex.
                      </span>
                      <span>
                        <strong>2</strong>
                        Travellex creates a booking code.
                      </span>
                      <span>
                        <strong>3</strong>
                        Partner confirms the booking automatically or sends a booking report.
                      </span>
                      <span>
                        <strong>4</strong>
                        Travellex calculates the commission.
                      </span>
                    </div>
                  </article>
                </div>

                <div className="admin-kpi-grid compact">
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Current default</p>
                    <h2>{commissionSettings.defaultCommissionRatePercent || 0}%</h2>
                  </article>
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Tour exceptions</p>
                    <h2>{tourCommissionOverrideCount}</h2>
                  </article>
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Confirmed commission</p>
                    <h2>{eur.format(commissionStats.confirmed)}</h2>
                  </article>
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Waiting for payout</p>
                    <h2>{eur.format(commissionStats.open)}</h2>
                  </article>
                </div>

                <div className="commission-action-grid">
                  <article className="side-panel">
                    <p className="eyebrow">One tour needs a special rate?</p>
                    <h2>Edit that tour only.</h2>
                    <p>
                      Open Tours, edit the listing, and set the special commission for that tour. That tour rate will
                      be used instead of the normal default.
                    </p>
                    <button className="button secondary" type="button" onClick={() => setActiveTab("tours")}>
                      Open tours
                    </button>
                  </article>
                  <article className="side-panel">
                    <p className="eyebrow">A partner sent a booking report?</p>
                    <h2>Enter it under Bookings & Payments.</h2>
                    <p>
                      Use the Travellex booking code from the partner report. The system will calculate commission from
                      the booking amount and rate.
                    </p>
                    <button className="button secondary" type="button" onClick={() => setActiveTab("referrals")}>
                      Open bookings
                    </button>
                  </article>
                </div>
              </div>
            )}
            {activeTab === "users" && (
              <div className="admin-grid users-admin-grid">
                <section className="side-panel user-form-fold">
                  <button
                    className="user-form-toggle"
                    type="button"
                    onClick={() => setUserFormOpen((current) => !current)}
                    aria-expanded={userFormOpen}
                  >
                    <span>{editingUserId ? "Editing user" : "Create user"}</span>
                    <strong>{userFormOpen ? "Hide" : "Open"}</strong>
                  </button>
                  {userFormOpen && (
                    <form className="panel-form admin-form user-form-panel" onSubmit={handleUserSubmit}>
                      <h2>{editingUserId ? "Edit user" : "Create user"}</h2>
                      <label className="field">
                        <span>Name</span>
                        <input value={userForm.name} onChange={(event) => updateUserField("name", event.target.value)} required />
                      </label>
                      <label className="field">
                        <span>Email</span>
                        <input type="email" value={userForm.email} onChange={(event) => updateUserField("email", event.target.value)} required />
                      </label>
                      <div className="form-grid">
                        <label className="field">
                          <span>Password {editingUserId ? "(leave blank to keep)" : ""}</span>
                          <input
                            type="password"
                            minLength="8"
                            value={userForm.password}
                            onChange={(event) => updateUserField("password", event.target.value)}
                            required={!editingUserId}
                          />
                        </label>
                        <label className="field">
                          <span>Country</span>
                          <input value={userForm.country} onChange={(event) => updateUserField("country", event.target.value)} />
                        </label>
                      </div>
                      <label className="field">
                        <span>Role</span>
                        <select value={userForm.role} onChange={(event) => updateUserField("role", event.target.value)}>
                          {userRoles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="button-row">
                        <button className="button primary" type="submit">
                          {editingUserId ? "Update user" : "Create user"}
                        </button>
                        {editingUserId && (
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => {
                              setEditingUserId("");
                              setUserForm(emptyUser);
                              setUserFormOpen(false);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </section>
                <div className="admin-list users-admin-list">
                  <div className="tab-row user-role-tabs" role="tablist" aria-label="User roles">
                    <button
                      className={userRoleFilter === "all" ? "active" : ""}
                      type="button"
                      onClick={() => {
                        setUserRoleFilter("all");
                        loadUsersForFilters(1, { role: "all" });
                      }}
                    >
                      All users ({totalUserCount})
                    </button>
                    {userRoles.map((role) => (
                      <button
                        className={userRoleFilter === role ? "active" : ""}
                        key={role}
                        type="button"
                        onClick={() => {
                          setUserRoleFilter(role);
                          loadUsersForFilters(1, { role });
                        }}
                      >
                        {userRoleTabLabels[role] || roleLabels[role]} ({userPagination.roleCounts?.[role] || 0})
                      </button>
                    ))}
                  </div>
                  <div className="admin-toolbar">
                    <label className="field">
                      <span>Search users</span>
                      <input
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        placeholder="Name, email, country or role"
                      />
                    </label>
                    <label className="field">
                      <span>Sort</span>
                      <select value={userSort} onChange={(event) => setUserSort(event.target.value)}>
                        {userSortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Rows</span>
                      <select
                        value={userPagination.limit || ADMIN_USER_PAGE_SIZE}
                        onChange={(event) => loadUsersForFilters(1, { limit: Number(event.target.value) })}
                      >
                        {ADMIN_USER_PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="button primary compact" type="button" onClick={() => loadUsersForFilters(1)}>
                      Search
                    </button>
                    <div className="admin-view-switch" role="group" aria-label="User view">
                      {["compact", "list", "cards"].map((mode) => (
                        <button
                          className={userView === mode ? "active" : ""}
                          key={mode}
                          type="button"
                          onClick={() => setUserView(mode)}
                          aria-pressed={userView === mode}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                    <p className="form-note">
                      Showing {visibleUsers.length} loaded of {userPagination.total} users. Page {userPagination.page} of{" "}
                      {userPagination.totalPages}.
                    </p>
                  </div>
                  <div className={`admin-list-grid view-${userView}`}>
                    {visibleUsers.map((user) => (
                      <article className={expandedUserId === user.id ? "admin-row user-admin-row expanded" : "admin-row user-admin-row"} key={user.id}>
                        <div>
                          <button
                            className="user-name-toggle"
                            type="button"
                            onClick={() => setExpandedUserId((current) => (current === user.id ? "" : user.id))}
                            aria-expanded={expandedUserId === user.id}
                          >
                            {user.name}
                          </button>
                          <span>
                            {user.email} - {roleLabels[user.role] || user.role} - {user.country || "No country"} -{" "}
                            {user.suspended ? "Suspended" : "Active"}
                          </span>
                        </div>
                        {expandedUserId === user.id && (
                          <div className="user-row-details">
                            <div className="user-detail-grid">
                              <span>Role: {roleLabels[user.role] || user.role}</span>
                              <span>Country: {user.country || "No country"}</span>
                              <span>Email: {user.emailVerified ? "verified" : "unverified"}</span>
                              <span>Status: {user.suspended ? "Suspended" : "Active"}</span>
                            </div>
                            <div className="button-row">
                              <label className="inline-role-select">
                                <span>Role</span>
                                <select
                                  aria-label={`Change ${user.name} role`}
                                  value={user.role}
                                  onChange={(event) => handleUserRoleChange(user.id, event.target.value)}
                                >
                                  {userRoles.map((role) => (
                                    <option key={role} value={role}>
                                      {roleLabels[role]}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <button
                                className="button secondary compact"
                                type="button"
                                onClick={() => {
                                  setPreviewUserId(user.id);
                                  setActiveTab("role dashboards");
                                }}
                              >
                                View dashboard
                              </button>
                              <button className="button secondary compact" type="button" onClick={() => editUser(user)}>
                                Edit
                              </button>
                              <button
                                className={user.suspended ? "button secondary compact" : "button danger compact"}
                                type="button"
                                onClick={() => handleUserSuspension(user.id, !user.suspended)}
                              >
                                {user.suspended ? "Activate" : "Suspend"}
                              </button>
                              <ConfirmActionButton
                                actionLabel={`Delete ${user.name}`}
                                confirmMessage={`Delete ${user.name}? This removes the account and cannot be undone.`}
                                iconOnly
                                onConfirm={() => removeUser(user.id)}
                              />
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                  <div className="button-row">
                    <button
                      className="button secondary compact"
                      type="button"
                      disabled={userPagination.page <= 1}
                      onClick={() => loadUsersForFilters(userPagination.page - 1)}
                    >
                      Previous users
                    </button>
                    <button
                      className="button secondary compact"
                      type="button"
                      disabled={userPagination.page >= userPagination.totalPages}
                      onClick={() => loadUsersForFilters(userPagination.page + 1)}
                    >
                      Next users
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "role dashboards" && (
              <div className="admin-list full">
                <div className="side-panel role-preview-header">
                  <div>
                    <p className="eyebrow">Admin visibility</p>
                    <h2>View a user role dashboard without leaving the CRM.</h2>
                    <p>
                      Select any account to see the traveller, tour company, guide, moderator or admin work connected to
                      that user.
                    </p>
                  </div>
                  <label className="field">
                    <span>Preview account</span>
                    <select
                      value={previewUser?.id || ""}
                      onChange={(event) => setPreviewUserId(event.target.value)}
                      disabled={!users.length}
                    >
                      {users.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {roleLabels[item.role] || item.role}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {previewUser && roleDashboardPreview ? (
                  <>
                    <article className="side-panel role-profile-card">
                      <div>
                        <p className="eyebrow">{roleLabels[previewUser.role] || previewUser.role} dashboard</p>
                        <h2>{previewUser.name}</h2>
                        <p>
                          {previewUser.email} - {previewUser.country || "No country listed"} - Joined{" "}
                          {formatDate(previewUser.createdAt)}
                        </p>
                      </div>
                      <div className="button-row">
                        <button
                          className="button secondary compact"
                          type="button"
                          onClick={() => {
                            editUser(previewUser);
                            setActiveTab("users");
                          }}
                        >
                          Edit / promote
                        </button>
                      </div>
                    </article>
                    <div className="role-preview-grid">
                      {roleDashboardPreview.cards.map((card) => (
                        <article className="side-panel role-preview-card" key={card.eyebrow}>
                          <p className="eyebrow">{card.eyebrow}</p>
                          <h2>{card.value}</h2>
                          <p>{card.note}</p>
                          <div className="mini-list">
                            {card.items.map((item) => (
                              <article className="mini-row" key={`${card.eyebrow}-${item.title}-${item.meta}`}>
                                <strong>{item.title}</strong>
                                <span>{item.meta}</span>
                              </article>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="side-panel">
                    <p>No users are available yet. Create a user first, then preview role dashboards here.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "company applications" && (
              <div className="admin-list full partner-application-workflow">
                <section className="side-panel partner-pending-section">
                  <div className="partner-application-section-head">
                    <div>
                      <p className="eyebrow">Pending partner requests</p>
                      <h2>Needs review</h2>
                    </div>
                    <span className="partner-application-count">{pendingCompanyApplicationCount}</span>
                  </div>
                  {pendingCompanyApplicationItems.length ? (
                    <div className="admin-list-grid view-list">
                      {pendingCompanyApplicationItems.map((application) => renderCompanyApplicationRow(application, { canReview: true }))}
                    </div>
                  ) : (
                    <p>No pending partner requests.</p>
                  )}
                </section>

                <section className="partner-reviewed-section">
                  <div className="tab-row partner-review-tabs" role="tablist" aria-label="Reviewed partner applications">
                    {partnerApplicationReviewTabs.map((tab) => (
                      <button
                        className={partnerApplicationReviewTab === tab.value ? "active" : ""}
                        key={tab.value}
                        type="button"
                        onClick={() => setPartnerApplicationReviewTab(tab.value)}
                      >
                        {tab.label} ({partnerApplicationReviewCounts[tab.value] || 0})
                      </button>
                    ))}
                  </div>
                  <AdminCollection
                    items={reviewedCompanyApplicationItems}
                    label={partnerApplicationReviewTab === "approved" ? "approved partners" : "rejected partner applications"}
                    emptyText={
                      partnerApplicationReviewTab === "approved"
                        ? "No approved partners yet."
                        : "No rejected partner applications yet."
                    }
                    searchKeys={[
                      "companyName",
                      "contactName",
                      "email",
                      "headquarters",
                      "website",
                      "reviewNotes",
                      (application) => application.operatingRegions?.join(" "),
                      (application) => partnerApplicationStatusLabel(application.status)
                    ]}
                    filterOptions={[
                      { value: "has-notes", label: "Has review notes", predicate: (application) => Boolean(application.reviewNotes) },
                      { value: "has-whatsapp", label: "Has WhatsApp", predicate: (application) => Boolean(application.whatsapp) },
                      { value: "has-phone", label: "Has phone", predicate: (application) => Boolean(application.phone) }
                    ]}
                    sortOptions={[
                      { value: "newest", label: "Newest request", compare: (left, right) => compareDateNewest(left.createdAt, right.createdAt) },
                      { value: "reviewed", label: "Latest decision", compare: (left, right) => compareDateNewest(left.reviewedAt, right.reviewedAt) },
                      { value: "company", label: "Company A-Z", compare: (left, right) => compareText(left.companyName, right.companyName) }
                    ]}
                    searchPlaceholder="Search reviewed partner applications"
                  >
                    {(application) => renderCompanyApplicationRow(application)}
                  </AdminCollection>
                </section>
              </div>
            )}
            {activeTab === "guide applications" && (
              <AdminCollection
                items={guideApplications}
                label="guide applications"
                emptyText="No guide applications yet."
                searchKeys={["guideName", "email", "tour.title", (application) => application.languages?.join(" "), "status"]}
                filterOptions={[
                  { value: "submitted", label: "Submitted", predicate: (application) => application.status === "submitted" },
                  { value: "company_approved", label: "Needs admin confirmation", predicate: (application) => application.status === "company_approved" },
                  { value: "admin_approved", label: "Approved", predicate: (application) => application.status === "admin_approved" },
                  {
                    value: "rejected",
                    label: "Rejected",
                    predicate: (application) => ["company_rejected", "admin_rejected"].includes(application.status)
                  }
                ]}
                sortOptions={[
                  { value: "newest", label: "Newest", compare: (left, right) => compareDateNewest(left.createdAt, right.createdAt) },
                  { value: "guide", label: "Guide A-Z", compare: (left, right) => compareText(left.guideName, right.guideName) },
                  { value: "rate", label: "Highest rate", compare: (left, right) => compareNumber(right.dailyRateEUR, left.dailyRateEUR) },
                  { value: "status", label: "Status", compare: (left, right) => compareText(left.status, right.status) }
                ]}
                searchPlaceholder="Search guide, tour, email or language"
              >
                {(application) => (
                  <article className="admin-row" key={application._id}>
                    <div>
                      <strong>{application.guideName}</strong>
                      <span>
                        {application.tour?.title || "Tour"} - {application.email} - {application.status}
                      </span>
                      <p>
                        Rate: {application.dailyRateEUR ? eur.format(application.dailyRateEUR) : "Not provided"} per day -
                        Languages: {application.languages?.join(", ") || "Not provided"}
                      </p>
                      <p>{application.message || "No message provided."}</p>
                    </div>
                    <div className="button-row">
                      <a className="button secondary compact" href={`mailto:${application.email}`}>
                        Manual email
                      </a>
                      {application.whatsapp && (
                        <a
                          className="button secondary compact"
                          href={`https://wa.me/${application.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      )}
                      <button
                        className="button primary compact"
                        type="button"
                        disabled={application.status !== "company_approved"}
                        onClick={() => handleGuideAdminDecision(application._id, "approved")}
                      >
                        Confirm & email
                      </button>
                      <button
                        className="button danger compact"
                        type="button"
                        onClick={() => handleGuideAdminDecision(application._id, "rejected")}
                      >
                        Reject & email
                      </button>
                    </div>
                  </article>
                )}
              </AdminCollection>
            )}
            {activeTab === "guide bookings" && (
              <AdminCollection
                items={guideBookings}
                label="guide bookings"
                emptyText="No guide bookings yet."
                searchKeys={["tour.title", "guide.name", "name", "email", "travelDates", "status"]}
                filterOptions={[
                  { value: "requested", label: "Requested", predicate: (booking) => booking.status === "requested" },
                  { value: "accepted", label: "Accepted", predicate: (booking) => booking.status === "accepted" },
                  { value: "declined", label: "Declined", predicate: (booking) => booking.status === "declined" },
                  { value: "closed", label: "Closed", predicate: (booking) => booking.status === "closed" }
                ]}
                sortOptions={[
                  { value: "newest", label: "Newest", compare: (left, right) => compareDateNewest(left.createdAt, right.createdAt) },
                  { value: "tour", label: "Tour A-Z", compare: (left, right) => compareText(left.tour?.title, right.tour?.title) },
                  { value: "traveller", label: "Traveller A-Z", compare: (left, right) => compareText(left.name, right.name) },
                  { value: "status", label: "Status", compare: (left, right) => compareText(left.status, right.status) }
                ]}
                searchPlaceholder="Search tour, guide, traveller or dates"
              >
                {(booking) => (
                  <article className="admin-row" key={booking._id}>
                    <div>
                      <strong>{booking.tour?.title || "Tour"} guide request</strong>
                      <span>
                        Guide: {booking.guide?.name || "Guide"} - Traveller: {booking.name} ({booking.email}) - {booking.status}
                      </span>
                      <p>
                        Dates: {booking.travelDates || "Not provided"} - Group: {booking.groupSize || "Not provided"}
                      </p>
                      <p>{booking.message || "No message provided."}</p>
                    </div>
                    <select value={booking.status} onChange={(event) => handleGuideBookingStatus(booking._id, event.target.value)}>
                      <option value="requested">requested</option>
                      <option value="accepted">accepted</option>
                      <option value="declined">declined</option>
                      <option value="closed">closed</option>
                    </select>
                  </article>
                )}
              </AdminCollection>
            )}
            {activeTab === "gallery media" && (
              <div className="admin-grid">
                <form className="panel-form admin-form" onSubmit={handleGallerySubmit}>
                  <h2>{editingGalleryMediaId ? "Edit gallery media" : "Add gallery media"}</h2>
                  <label className="field">
                    <span>Title</span>
                    <input value={galleryForm.title} onChange={(event) => updateGalleryField("title", event.target.value)} required />
                  </label>
                  <div className="form-grid">
                    <label className="field">
                      <span>Media type</span>
                      <select value={galleryForm.mediaType} onChange={(event) => updateGalleryField("mediaType", event.target.value)}>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Status</span>
                      <select value={galleryForm.status} onChange={(event) => updateGalleryField("status", event.target.value)}>
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    <span>Media URL</span>
                    <input value={galleryForm.url} onChange={(event) => updateGalleryField("url", event.target.value)} required />
                  </label>
                  <label className="field">
                    <span>Thumbnail URL for video</span>
                    <input value={galleryForm.thumbnailUrl} onChange={(event) => updateGalleryField("thumbnailUrl", event.target.value)} />
                  </label>
                  <div className="form-grid">
                    <label className="field">
                      <span>Location</span>
                      <input value={galleryForm.location} onChange={(event) => updateGalleryField("location", event.target.value)} />
                    </label>
                    <label className="field">
                      <span>Travel date / season</span>
                      <input value={galleryForm.travelDate} onChange={(event) => updateGalleryField("travelDate", event.target.value)} />
                    </label>
                    <label className="field">
                      <span>Credit name</span>
                      <input value={galleryForm.creditName} onChange={(event) => updateGalleryField("creditName", event.target.value)} />
                    </label>
                    <label className="field">
                      <span>Credit email</span>
                      <input
                        type="email"
                        value={galleryForm.creditEmail}
                        onChange={(event) => updateGalleryField("creditEmail", event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="form-grid">
                    <label className="field">
                      <span>Visible from</span>
                      <input
                        type="datetime-local"
                        value={galleryForm.visibleFrom}
                        onChange={(event) => updateGalleryField("visibleFrom", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Switch off / expire at</span>
                      <input
                        type="datetime-local"
                        value={galleryForm.expiresAt}
                        onChange={(event) => updateGalleryField("expiresAt", event.target.value)}
                      />
                    </label>
                  </div>
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={galleryForm.isActive}
                      onChange={(event) => updateGalleryField("isActive", event.target.checked)}
                    />
                    Active in gallery
                  </label>
                  <label className="field">
                    <span>Description / story</span>
                    <textarea
                      value={galleryForm.description}
                      onChange={(event) => updateGalleryField("description", event.target.value)}
                      rows="5"
                    />
                  </label>
                  <div className="button-row">
                    <button className="button primary" type="submit">
                      {editingGalleryMediaId ? "Update media" : "Create media"}
                    </button>
                    {editingGalleryMediaId && (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => {
                          setEditingGalleryMediaId("");
                          setGalleryForm(emptyGalleryMedia);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                <AdminCollection
                  className="admin-list"
                  items={galleryMedia}
                  label="media items"
                  emptyText="No gallery media yet."
                  searchKeys={["title", "description", "location", "creditName", "submittedBy.name", "status", "mediaType"]}
                  filterOptions={[
                    { value: "pending", label: "Pending", predicate: (item) => item.status === "pending" },
                    { value: "approved", label: "Approved", predicate: (item) => item.status === "approved" },
                    { value: "rejected", label: "Rejected", predicate: (item) => item.status === "rejected" },
                    { value: "active", label: "Active", predicate: (item) => item.isActive },
                    { value: "off", label: "Off", predicate: (item) => !item.isActive },
                    { value: "video", label: "Video", predicate: (item) => item.mediaType === "video" }
                  ]}
                  sortOptions={[
                    { value: "newest", label: "Newest", compare: (left, right) => compareDateNewest(left.createdAt, right.createdAt) },
                    { value: "title", label: "Title A-Z", compare: (left, right) => compareText(left.title, right.title) },
                    { value: "status", label: "Status", compare: (left, right) => compareText(left.status, right.status) },
                    { value: "expiry", label: "Expiry", compare: (left, right) => compareDateNewest(right.expiresAt, left.expiresAt) }
                  ]}
                  searchPlaceholder="Search title, location, credit or status"
                >
                  {(item) => (
                    <article className="admin-row" key={item._id}>
                      <div>
                        <strong>{item.title}</strong>
                        <span>
                          {item.mediaType} - {item.status} - {item.isActive ? "active" : "off"} -{" "}
                          {item.expiresAt ? `expires ${formatDate(item.expiresAt)}` : "no expiry"}
                        </span>
                        <p>{item.location || "No location"} - {item.creditName || item.submittedBy?.name || "No credit"}</p>
                      </div>
                      <div className="button-row">
                        <button className="button secondary compact" type="button" onClick={() => editGalleryMedia(item)}>
                          Edit
                        </button>
                        <button className="button primary compact" type="button" onClick={() => handleGalleryReview(item._id, "approved")}>
                          Approve & email
                        </button>
                        <button className="button secondary compact" type="button" onClick={() => handleGalleryReview(item._id, "pending")}>
                          Pending
                        </button>
                        <button className="button danger compact" type="button" onClick={() => handleGalleryReview(item._id, "rejected")}>
                          Reject & email
                        </button>
                        <ConfirmActionButton
                          actionLabel={`Delete ${item.title}`}
                          confirmMessage={`Delete gallery media "${item.title}"? This cannot be undone.`}
                          iconOnly
                          onConfirm={() => removeGalleryMedia(item._id)}
                        />
                      </div>
                    </article>
                  )}
                </AdminCollection>
              </div>
            )}
            {activeTab === "tours" && (
              <div className="admin-grid users-admin-grid tours-admin-grid">
                <section className="side-panel user-form-fold">
                  <button
                    className="user-form-toggle"
                    type="button"
                    onClick={() => setTourFormOpen((current) => !current)}
                    aria-expanded={tourFormOpen}
                  >
                    <span>{editingTourId ? "Editing tour" : "Create tour"}</span>
                    <strong>{tourFormOpen ? "Hide" : "Open"}</strong>
                  </button>
                  {tourFormOpen && (
                    <TourListingForm
                      allowStatusControls
                      commissionSettings={commissionSettings}
                      editing={Boolean(editingTourId)}
                      form={tourForm}
                      isAdmin={isAdmin}
                      onCancel={() => {
                        setEditingTourId("");
                        setTourForm(emptyTour);
                        setTourFormOpen(false);
                      }}
                      onFieldChange={updateTourField}
                      onSubmit={handleTourSubmit}
                      onUpload={handleUpload}
                      partnerOptions={partnerOptions}
                      showCommissionField
                      showPartnerSelect
                      showReviewFields
                      showVrFields={isAdmin}
                      submitLabel={editingTourId ? "Update tour" : "Create tour"}
                      uploading={uploading}
                    />
                  )}
                </section>
                <AdminCollection
                  className="admin-list tour-card-collection"
                  items={tours}
                  label="tours"
                  emptyText="No tours yet."
                  searchKeys={[
                    "title",
                    "location",
                    "category",
                    "partner.name",
                    "shortDescription",
                    "description",
                    "comfortLevel",
                    "tourType",
                    "routeSummary",
                    "inclusions",
                    "exclusions",
                    "priceBasis",
                    "confirmationType",
                    "languages",
                    "meetingPoint",
                    "pickupDetails",
                    "difficulty",
                    "accessibility",
                    "transport",
                    "accommodation",
                    "meals",
                    "availableWeekdays",
                    "cancellationPolicy",
                    "paymentTerms",
                    "whatToBring",
                    "notSuitableFor",
                    (tour) => (tour.itinerary || []).map((item) => `${item.title || ""} ${item.description || ""}`).join(" ")
                  ]}
                  filterOptions={[
                    { value: "active", label: "Active", predicate: (tour) => tour.isActive },
                    { value: "pending", label: "Pending", predicate: (tour) => !tour.isActive },
                    { value: "featured", label: "Featured", predicate: (tour) => tour.featured },
                    { value: "vr", label: "VR enabled", predicate: (tour) => tour.vrEnabled },
                    ...comfortLevelOptions.map((level) => ({
                      value: `comfort-${level}`,
                      label: level,
                      predicate: (tour) => tour.comfortLevel === level
                    })),
                    ...activityOptions.map((activity) => ({
                      value: `category-${activity}`,
                      label: activity,
                      predicate: (tour) => tour.category === activity
                    }))
                  ]}
                  sortOptions={[
                    { value: "newest", label: "Newest", compare: (left, right) => compareDateNewest(left.createdAt, right.createdAt) },
                    { value: "title", label: "Title A-Z", compare: (left, right) => compareText(left.title, right.title) },
                    { value: "location", label: "Location A-Z", compare: (left, right) => compareText(left.location, right.location) },
                    { value: "price-low", label: "Price low-high", compare: (left, right) => compareNumber(left.priceEUR, right.priceEUR) },
                    { value: "price-high", label: "Price high-low", compare: (left, right) => compareNumber(right.priceEUR, left.priceEUR) },
                    { value: "rating", label: "Rating high-low", compare: (left, right) => compareNumber(right.reviewRating, left.reviewRating) }
                  ]}
                  searchPlaceholder="Search title, location, partner or category"
                >
                  {(tour) => (
                    <article className="admin-row admin-tour-row" key={tour._id}>
                      <TourManagementMedia tour={tour} />
                      <div className="admin-tour-card-body">
                        <div className="admin-tour-card-head">
                          <div>
                            <strong>{tour.title}</strong>
                            <span>{tour.partner?.name || "No partner"} - {tour.location || "Location not set"}</span>
                          </div>
                          <div className="admin-tour-price">
                            <strong>{eur.format(tour.priceEUR)}</strong>
                            <span>{tour.priceBasis || "Per person"}</span>
                          </div>
                        </div>
                        <div className="admin-tour-meta-grid">
                          <span>{tour.category || "Category"}</span>
                          <span>{tour.duration || "Duration not set"}</span>
                          <span>{tour.comfortLevel || "Comfort not set"}</span>
                          <span>{tour.images?.length || 0}/{MAX_TOUR_MEDIA_ITEMS} media</span>
                          {tour.vrEnabled && <span className="tour-vr-admin-status">VR on</span>}
                        </div>
                        <p>{tour.shortDescription || tour.routeSummary || tour.description || "No short description saved yet."}</p>
                        <div className="admin-inline-flags luxury-toggle-row">
                          <label className="lux-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(tour.featured)}
                              onChange={(event) => handleTourQuickToggle(tour._id, "featured", event.target.checked)}
                            />
                            <span aria-hidden="true" />
                            Featured
                            <InfoHint text="Featured tours can appear in homepage and promoted listing areas." />
                          </label>
                          <label className="lux-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(tour.isActive)}
                              onChange={(event) => handleTourQuickToggle(tour._id, "isActive", event.target.checked)}
                            />
                            <span aria-hidden="true" />
                            Public
                            <InfoHint text="Active tours are visible to travellers. Turn off to keep as an internal draft." />
                          </label>
                        </div>
                      </div>
                      <div className="button-row">
                        <button className="button secondary compact" type="button" onClick={() => editTour(tour)}>
                          Edit
                        </button>
                        <ConfirmActionButton
                          actionLabel={`Delete ${tour.title}`}
                          confirmMessage={`Delete tour "${tour.title}"? This cannot be undone.`}
                          iconOnly
                          onConfirm={() => removeTour(tour._id)}
                        />
                      </div>
                    </article>
                  )}
                </AdminCollection>
              </div>
            )}
            {activeTab === "partners" && (
              <div className="admin-grid">
                <form className="panel-form admin-form partner-admin-form" onSubmit={handlePartnerSubmit}>
                  <h2>{editingPartnerId ? "Edit partner" : "Add partner"}</h2>
                  <div className="partner-approval-banner">
                    <p className="eyebrow">Instant approval</p>
                    <strong>
                      {editingPartnerId
                        ? "Partner details stay connected to the approved dashboard account."
                        : "Creating a partner also creates or upgrades the tour company account."}
                    </strong>
                    <span>
                      The contact email becomes the owner login, and an active partner can add listings straight away.
                    </span>
                  </div>
                  {Object.keys(emptyPartner)
                    .filter((key) => key !== "isActive")
                    .map((key) => (
                      <label className="field" key={key}>
                        <span>{partnerFieldLabels[key] || key}</span>
                        {["description", "commissionTerms"].includes(key) ? (
                          <textarea value={partnerForm[key]} onChange={(event) => updatePartnerField(key, event.target.value)} />
                        ) : (
                          <input
                            type={
                              key === "contactEmail"
                                ? "email"
                                : ["commissionRatePercent", "rating", "reviewCount"].includes(key)
                                  ? "number"
                                  : "text"
                            }
                            min={["commissionRatePercent", "rating", "reviewCount"].includes(key) ? "0" : undefined}
                            max={key === "commissionRatePercent" ? "100" : key === "rating" ? "5" : undefined}
                            step={key === "rating" ? "0.1" : undefined}
                            value={partnerForm[key]}
                            onChange={(event) => updatePartnerField(key, event.target.value)}
                            required={["name", "contactEmail"].includes(key)}
                          />
                        )}
                      </label>
                    ))}
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={partnerForm.isActive}
                      onChange={(event) => updatePartnerField("isActive", event.target.checked)}
                    />
                    Active partner
                  </label>
                  <div className="button-row partner-form-actions">
                    <button className="button primary" type="submit">
                      {editingPartnerId ? "Update partner" : "Create approved partner"}
                    </button>
                    {editingPartnerId && (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => {
                          setEditingPartnerId("");
                          setPartnerForm(emptyPartner);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                <AdminCollection
                  className="admin-list"
                  items={partners}
                  label="partners"
                  emptyText="No partners yet."
                  searchKeys={["name", "location", "contactEmail", "contactPhone", "description", "licenseInfo", "commissionTerms"]}
                  filterOptions={[
                    { value: "active", label: "Active", predicate: (partner) => partner.isActive },
                    { value: "inactive", label: "Inactive", predicate: (partner) => !partner.isActive },
                    { value: "reviewed", label: "Reviewed", predicate: (partner) => Number(partner.rating || 0) > 0 },
                    { value: "has-secret", label: "Automatic report key ready", predicate: (partner) => Boolean(partner.postbackSecret) }
                  ]}
                  sortOptions={[
                    { value: "name", label: "Name A-Z", compare: (left, right) => compareText(left.name, right.name) },
                    { value: "location", label: "Location A-Z", compare: (left, right) => compareText(left.location, right.location) },
                    { value: "rating-high", label: "Rating high-low", compare: (left, right) => compareNumber(right.rating, left.rating) },
                    { value: "commission-high", label: "Commission high-low", compare: (left, right) => compareNumber(right.commissionRatePercent, left.commissionRatePercent) },
                    { value: "newest", label: "Newest", compare: (left, right) => compareDateNewest(left.createdAt, right.createdAt) }
                  ]}
                  searchPlaceholder="Search partner, location, trust note or terms"
                >
                  {(partner) => (
                    <article className="admin-row partner-admin-row" key={partner._id}>
                      <div>
                        <strong>{partner.name}</strong>
                        <span>
                          {partner.location || "Location not set"} - {partner.rating ? `${Number(partner.rating).toFixed(1)} / 5` : "No rating"} - Commission {partner.commissionRatePercent || 0}%
                        </span>
                        <div className="partner-account-strip">
                          <span>
                            <strong>Dashboard access</strong>
                            {partner.ownerUser
                              ? `${partner.ownerUser.name || partner.ownerUser.email} - ${roleLabels[partner.ownerUser.role] || partner.ownerUser.role}`
                              : "No linked login yet"}
                          </span>
                          <span>
                            <strong>Approval</strong>
                            {partner.isActive ? "Approved and active" : "Inactive"}
                          </span>
                        </div>
                        {partner.licenseInfo && <p>{partner.licenseInfo}</p>}
                        <p>{partner.commissionTerms || "No commission terms saved yet."}</p>
                        <details className="postback-box">
                          <summary>Advanced: automatic booking report setup</summary>
                          <p>
                            Share this only with the partner&apos;s website team. It lets their booking system tell
                            Travellex when a tracked booking is confirmed.
                          </p>
                          <code>{`${apiBaseURL}/referrals/postback`}</code>
                          <code>{`Booking-report key: ${partner.postbackSecret || "Use Reset key to generate one"}`}</code>
                          <code>{`Example report: {"travellex_ref":"BOOKING_CODE","bookingValueEUR":2000,"partnerBookingId":"BOOKING-123","status":"converted"}`}</code>
                        </details>
                      </div>
                      <div className="button-row">
                        <button className="button secondary compact" type="button" onClick={() => editPartner(partner)}>
                          Edit
                        </button>
                        <button className="button secondary compact" type="button" onClick={() => rotatePartnerSecret(partner._id)}>
                          Reset key
                        </button>
                        <ConfirmActionButton
                          actionLabel={`Delete ${partner.name}`}
                          confirmMessage={`Delete partner "${partner.name}"? This cannot be undone.`}
                          iconOnly
                          onConfirm={() => removePartner(partner._id)}
                        />
                      </div>
                    </article>
                  )}
                </AdminCollection>
              </div>
            )}
            {activeTab === "enquiries" && (
              <AdminCollection
                className="admin-list full enquiry-admin-list"
                defaultView="list"
                items={enquiries}
                label="enquiries"
                emptyText="No enquiries yet."
                searchKeys={["name", "email", "destination", "message", "tour.title", "partner.name", "type", "status"]}
                filterOptions={[
                  { value: "new", label: "New", predicate: (enquiry) => enquiry.status === "new" },
                  { value: "contacted", label: "Contacted", predicate: (enquiry) => enquiry.status === "contacted" },
                  { value: "referred", label: "Referred", predicate: (enquiry) => enquiry.status === "referred" },
                  { value: "closed", label: "Closed", predicate: (enquiry) => enquiry.status === "closed" },
                  { value: "partner_application", label: "Partner applications", predicate: (enquiry) => enquiry.type === "partner_application" }
                ]}
                sortOptions={[
                  { value: "newest", label: "Newest", compare: (left, right) => compareDateNewest(left.createdAt, right.createdAt) },
                  { value: "name", label: "Name A-Z", compare: (left, right) => compareText(left.name, right.name) },
                  { value: "status", label: "Status", compare: (left, right) => compareText(left.status, right.status) },
                  { value: "destination", label: "Destination A-Z", compare: (left, right) => compareText(left.destination, right.destination) }
                ]}
                searchPlaceholder="Search name, email, destination or message"
                viewModes={[
                  { value: "list", label: "Inbox" },
                  { value: "cards", label: "Cards" }
                ]}
              >
                {(enquiry) => (
                  <article className={`admin-row enquiry-message-card status-${enquiry.status || "new"}`} key={enquiry._id}>
                    <div className="enquiry-message-main">
                      <div className="enquiry-message-head">
                        <div>
                          <span className={`enquiry-status-pill status-${enquiry.status || "new"}`}>
                            {enquiryStatusLabel(enquiry.status)}
                          </span>
                          <strong>{enquiry.name || "Traveller"}</strong>
                          <span>
                            {enquirySubject(enquiry)} - {formatDate(enquiry.createdAt)}
                          </span>
                        </div>
                        <div className="button-row enquiry-contact-actions">
                          {enquiry.email && (
                            <a className="button secondary compact" href={`mailto:${enquiry.email}`}>
                              Reply by email
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="enquiry-quick-grid">
                        <span>
                          <strong>Email</strong>
                          {enquiry.email || "Not provided"}
                        </span>
                        <span>
                          <strong>Destination</strong>
                          {enquiry.destination || enquiry.tour?.location || "Not provided"}
                        </span>
                        <span>
                          <strong>Request</strong>
                          {enquiry.requestType === "quote" ? "Quote request" : "Question"}
                        </span>
                      </div>
                      <details className="enquiry-toggle-panel">
                        <summary>View message and details</summary>
                        <div className="enquiry-detail-grid">
                          <span>
                            <strong>Email</strong>
                            {enquiry.email || "Not provided"}
                          </span>
                          <span>
                            <strong>Destination</strong>
                            {enquiry.destination || enquiry.tour?.location || "Not provided"}
                          </span>
                          <span>
                            <strong>Request</strong>
                            {enquiry.requestType === "quote" ? "Quote request" : "Question"}
                          </span>
                          <span>
                            <strong>Tour</strong>
                            {enquiry.tour?.title || "General enquiry"}
                          </span>
                          <span>
                            <strong>Partner</strong>
                            {enquiry.partner?.name || "Not assigned"}
                          </span>
                          <span>
                            <strong>Travel date</strong>
                            {enquiry.travelDate ? formatDate(enquiry.travelDate) : "Not provided"}
                          </span>
                          <span>
                            <strong>Group size</strong>
                            {enquiry.groupSize || "Not provided"}
                          </span>
                          <span>
                            <strong>Budget</strong>
                            {enquiry.budgetEUR ? eur.format(enquiry.budgetEUR) : "Not provided"}
                          </span>
                        </div>
                        <section className="enquiry-message-body" aria-label="Traveller message body">
                          <span>Message body</span>
                          {enquiryMessageLines(enquiry).map((line, index) => (
                            <p key={`${enquiry._id}-message-${index}`}>{line}</p>
                          ))}
                        </section>
                      </details>
                      <details className="enquiry-toggle-panel enquiry-status-panel">
                        <summary>Update status</summary>
                        <div className="enquiry-status-actions">
                          <span>Current status: {enquiryStatusLabel(enquiry.status)}</span>
                          <select value={enquiry.status || "new"} onChange={(event) => handleStatusChange(enquiry._id, event.target.value)}>
                            {enquiryStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="enquiry-status-button-grid">
                            {enquiryStatusOptions.map((option) => (
                              <button
                                className={(enquiry.status || "new") === option.value ? "active" : ""}
                                key={option.value}
                                type="button"
                                onClick={() => handleStatusChange(enquiry._id, option.value)}
                                disabled={(enquiry.status || "new") === option.value}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  </article>
                )}
              </AdminCollection>
            )}
            {activeTab === "referrals" && (
              <div className="admin-list full">
                <div className="admin-kpi-grid compact">
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Booking starts</p>
                    <h2>{totalReferralCount}</h2>
                  </article>
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Bookings confirmed</p>
                    <h2>{commissionStats.converted}</h2>
                  </article>
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Confirmed</p>
                    <h2>{eur.format(commissionStats.confirmed)}</h2>
                  </article>
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Paid</p>
                    <h2>{eur.format(commissionStats.paid)}</h2>
                  </article>
                </div>
                <form className="panel-form tracking-reconcile-form" onSubmit={handleTrackingReconcileSubmit}>
                  <div>
                    <p className="eyebrow">Partner booking report</p>
                    <h2>Record a partner booking.</h2>
                    <p>
                      Use this when the partner confirms a booking by email, WhatsApp or invoice. If the partner&apos;s
                      website is connected, this can happen automatically.
                    </p>
                  </div>
                  <div className="commission-edit-grid">
                    <label className="field">
                      <span>Travellex booking code</span>
                      <input
                        value={trackingReconcileForm.trackingCode}
                        onChange={(event) => updateTrackingReconcileField("trackingCode", event.target.value)}
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Partner booking ID</span>
                      <input
                        value={trackingReconcileForm.partnerBookingId}
                        onChange={(event) => updateTrackingReconcileField("partnerBookingId", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Booking amount EUR</span>
                      <input
                        type="number"
                        min="0"
                        value={trackingReconcileForm.bookingValueEUR}
                        onChange={(event) => updateTrackingReconcileField("bookingValueEUR", event.target.value)}
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Commission %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={trackingReconcileForm.commissionRatePercent}
                        onChange={(event) => updateTrackingReconcileField("commissionRatePercent", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Commission EUR</span>
                      <input
                        type="number"
                        min="0"
                        value={trackingReconcileForm.commissionEUR}
                        onChange={(event) => updateTrackingReconcileField("commissionEUR", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Status</span>
                      <select
                        value={trackingReconcileForm.status}
                        onChange={(event) => updateTrackingReconcileField("status", event.target.value)}
                      >
                        {referralStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Notes</span>
                      <input
                        value={trackingReconcileForm.notes}
                        onChange={(event) => updateTrackingReconcileField("notes", event.target.value)}
                        placeholder="Report source, invoice, payout note"
                      />
                    </label>
                    <button className="button primary compact" type="submit">
                      Save booking
                    </button>
                  </div>
                </form>
                <AdminCollection
                  className="admin-list embedded referral-top-collection booking-card-collection"
                  defaultView="cards"
                  items={referrals}
                  label="booking records"
                  emptyText="No booking starts tracked yet."
                  searchKeys={["trackingCode", "tour.title", "partner.name", "user.email", "partnerBookingId", "status", "notes"]}
                  filterOptions={[
                    ...referralStatuses.map((status) => ({
                      value: status,
                      label: statusLabel(status),
                      predicate: (referral) => (referral.status || (referral.converted ? "converted" : "clicked")) === status
                    })),
                    { value: "unpaid", label: "Unpaid commission", predicate: (referral) => Number(referral.confirmedCommissionEUR || 0) > Number(referral.paidCommissionEUR || 0) },
                    { value: "guest", label: "Guest travellers", predicate: (referral) => !referral.user }
                  ]}
                  sortOptions={[
                    { value: "newest", label: "Newest", compare: (left, right) => compareDateNewest(left.clickedAt, right.clickedAt) },
                    { value: "tour", label: "Tour A-Z", compare: (left, right) => compareText(left.tour?.title, right.tour?.title) },
                    { value: "partner", label: "Partner A-Z", compare: (left, right) => compareText(left.partner?.name, right.partner?.name) },
                    { value: "confirmed-high", label: "Confirmed high-low", compare: (left, right) => compareNumber(right.confirmedCommissionEUR, left.confirmedCommissionEUR) },
                    { value: "status", label: "Status", compare: (left, right) => compareText(left.status, right.status) }
                  ]}
                  searchPlaceholder="Search booking code, tour, partner or traveller"
                  pageSize={12}
                  viewModes={[
                    { value: "cards", label: "Cards" },
                    { value: "compact", label: "Compact" },
                    { value: "list", label: "List" }
                  ]}
                >
                  {(referral) => (
                    <article className="admin-row referral-row" key={referral._id}>
                      <div className="booking-card-summary">
                        <div className="booking-card-head">
                          <div>
                            <strong>{referral.tour?.title || "Tour booking"}</strong>
                            <span>
                              {referral.partner?.name || "Partner"} - {formatDate(referral.clickedAt)}
                            </span>
                          </div>
                          <span className={`booking-status-pill status-${referral.status || (referral.converted ? "converted" : "clicked")}`}>
                            {statusLabel(referral.status || (referral.converted ? "converted" : "clicked"))}
                          </span>
                        </div>
                        <div className="booking-mini-grid">
                          <span>
                            <strong>Traveller</strong>
                            {referral.user?.email || "Signed-out guest"}
                          </span>
                          <span>
                            <strong>Confirmed</strong>
                            {eur.format(referral.confirmedCommissionEUR || 0)}
                          </span>
                          <span>
                            <strong>Paid</strong>
                            {eur.format(referral.paidCommissionEUR || 0)}
                          </span>
                        </div>
                        <div className="booking-card-actions">
                          {referral.outboundUrl && (
                            <a className="button secondary compact" href={referral.outboundUrl} target="_blank" rel="noreferrer">
                              Partner page
                            </a>
                          )}
                        </div>
                        <details className="booking-card-details">
                          <summary>Details and update</summary>
                          <div className="booking-detail-strip">
                            <span>
                              <strong>Travellex code</strong>
                              {referral.trackingCode || "legacy booking"}
                            </span>
                            <span>
                              <strong>Estimated</strong>
                              {eur.format(referral.estimatedCommissionEUR || 0)}
                            </span>
                            <span>
                              <strong>Booking ID</strong>
                              {referral.partnerBookingId || "Not saved"}
                            </span>
                          </div>
                          <div className="commission-edit-grid booking-edit-grid">
                            <label className="field">
                              <span>Booking amount EUR</span>
                              <input
                                type="number"
                                min="0"
                                value={referralField(referral, "bookingValueEUR")}
                                onChange={(event) => updateReferralField(referral._id, "bookingValueEUR", event.target.value)}
                              />
                            </label>
                            <label className="field">
                              <span>Commission %</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={referralField(referral, "commissionRatePercent")}
                                onChange={(event) => updateReferralField(referral._id, "commissionRatePercent", event.target.value)}
                              />
                            </label>
                            <label className="field">
                              <span>Commission EUR</span>
                              <input
                                type="number"
                                min="0"
                                value={referralField(referral, "commissionEUR") || referral.confirmedCommissionEUR || ""}
                                onChange={(event) => updateReferralField(referral._id, "commissionEUR", event.target.value)}
                              />
                            </label>
                            <label className="field">
                              <span>Paid EUR</span>
                              <input
                                type="number"
                                min="0"
                                value={referralField(referral, "paidCommissionEUR")}
                                onChange={(event) => updateReferralField(referral._id, "paidCommissionEUR", event.target.value)}
                              />
                            </label>
                            <label className="field">
                              <span>Status</span>
                              <select
                                value={referralField(referral, "status") || referral.status || "clicked"}
                                onChange={(event) => updateReferralField(referral._id, "status", event.target.value)}
                              >
                                {referralStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {statusLabel(status)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="field">
                              <span>Notes</span>
                              <input
                                value={referralField(referral, "notes")}
                                onChange={(event) => updateReferralField(referral._id, "notes", event.target.value)}
                                placeholder="Partner invoice, booking id, payout note"
                              />
                            </label>
                            <button className="button primary compact" type="button" onClick={() => handleReferralConversion(referral._id)}>
                              Save booking
                            </button>
                          </div>
                        </details>
                      </div>
                    </article>
                  )}
                </AdminCollection>
              </div>
            )}
            {activeTab === "uploads" && (
              <div className="side-panel">
                <p className="eyebrow">Cloudinary upload</p>
                <h2>Upload a tour image</h2>
                <label className="field">
                  <span className="label-with-info">
                    Tour media file
                    <InfoHint text={`Uploads are added to the open tour form. Each tour can keep up to ${MAX_TOUR_MEDIA_ITEMS} images or videos.`} />
                  </span>
                  <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={handleUpload} disabled={uploading} />
                </label>
                <p>
                  Uploaded media URLs are inserted into the tour form so they can be saved into the tour gallery.
                </p>
              </div>
            )}
          </>
        )}
        </div>
      </section>
      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </section>
  );
}
