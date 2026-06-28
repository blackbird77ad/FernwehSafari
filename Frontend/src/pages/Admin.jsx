import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmActionButton from "../components/ConfirmActionButton";
import PaginatedList from "../components/PaginatedList";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import travellexLogo from "../assets/photos/Travellex-logo-wordmark.png";
import useAuth from "../hooks/useAuth";
import { activityOptions, comfortLevelOptions, confirmationTypeOptions, priceBasisOptions, tourTypeOptions } from "../utils/travelOptions";
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
  commissionRatePercent: "Default commission %",
  commissionTerms: "Commission terms"
};

const tabMeta = {
  overview: {
    title: "Analytics",
    description: "Production numbers, commission pipeline and operational queues."
  },
  referrals: {
    title: "Referral Commissions",
    description: "Track outbound booking clicks, partner codes, conversion status and earned commission."
  },
  users: {
    title: "Users",
    description: "Search, promote and manage traveller, partner, guide, moderator and admin accounts."
  },
  "role dashboards": {
    title: "Role Dashboards",
    description: "Preview what each account type is doing without changing login sessions."
  },
  "company applications": {
    title: "Partner Applications",
    description: "Review tour company applications and move approved operators into the partner system."
  },
  tours: {
    title: "Tours",
    description: "Approve, edit and publish the tour inventory that powers the public site."
  },
  partners: {
    title: "Partners",
    description: "Manage partner booking URLs, commission rates and commercial terms."
  },
  "guide applications": {
    title: "Guide Applications",
    description: "Confirm company-approved tour guides before they appear on tours."
  },
  "guide bookings": {
    title: "Guide Bookings",
    description: "Monitor traveller requests sent to approved tour guides."
  },
  "gallery media": {
    title: "Gallery Media",
    description: "Approve, schedule, switch off and remove public travel media."
  },
  enquiries: {
    title: "Enquiries",
    description: "Track public questions and traveller contact requests."
  },
  uploads: {
    title: "Uploads",
    description: "Add Cloudinary media into tour and gallery workflows."
  }
};

const tabAccentColors = {
  overview: "#0e7490",
  referrals: "#c8a24a",
  users: "#047857",
  "role dashboards": "#6366f1",
  "company applications": "#b87333",
  tours: "#0f766e",
  partners: "#7c3aed",
  "guide applications": "#be123c",
  "guide bookings": "#2563eb",
  "gallery media": "#db2777",
  enquiries: "#ea580c",
  uploads: "#0891b2"
};

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
  return String(status || "not set").replace(/_/g, " ");
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
      message: `${baseMessage} Decision saved, but email notification failed: ${emailStatus.reason || "Check Resend configuration."}`
    };
  }

  if (emailStatus?.sent) {
    return { message: `${baseMessage} Email sent automatically.` };
  }

  return { message: baseMessage };
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
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
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
  const [galleryForm, setGalleryForm] = useState(emptyGalleryMedia);
  const [editingGalleryMediaId, setEditingGalleryMediaId] = useState("");
  const [uploading, setUploading] = useState(false);

  const partnerOptions = useMemo(
    () => partners.map((partner) => ({ value: partner._id, label: partner.name })),
    [partners]
  );

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "moderator";

  const tabs = useMemo(
    () => [
      "overview",
      ...(isAdmin ? ["referrals", "users", "role dashboards", "company applications"] : []),
      ...(isStaff ? ["tours", "guide applications", "guide bookings", "gallery media"] : []),
      ...(isAdmin ? ["partners", "enquiries"] : []),
      ...(isStaff ? ["uploads"] : [])
    ],
    [isAdmin, isStaff]
  );

  const commissionStats = useMemo(() => {
    const estimated = sumCurrency(referrals, "estimatedCommissionEUR");
    const confirmed = sumCurrency(referrals, "confirmedCommissionEUR");
    const paid = sumCurrency(referrals, "paidCommissionEUR");
    const converted = referrals.filter((referral) => referral.converted || ["converted", "paid"].includes(referral.status)).length;
    const open = Math.max(confirmed - paid, 0);
    const conversionRate = referrals.length ? Math.round((converted / referrals.length) * 100) : 0;

    return {
      estimated,
      confirmed,
      paid,
      open,
      converted,
      conversionRate
    };
  }, [referrals]);

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
        count: userPagination.roleCounts?.[role] || 0
      })),
    [userPagination.roleCounts]
  );
  const allUserRoleCount = useMemo(
    () => Object.values(userPagination.roleCounts || {}).reduce((total, count) => total + (Number(count) || 0), 0),
    [userPagination.roleCounts]
  );

  const crmStats = useMemo(
    () => [
      ...(isAdmin ? [{ label: "Users", value: users.length }] : []),
      { label: "Tours", value: tours.length },
      { label: "Operators", value: partners.length },
      ...(isAdmin ? [{ label: "Estimated commission", value: eur.format(commissionStats.estimated) }] : []),
      ...(isAdmin ? [{ label: "Confirmed commission", value: eur.format(commissionStats.confirmed) }] : []),
      ...(isAdmin ? [{ label: "Unpaid commission", value: eur.format(commissionStats.open) }] : []),
      ...(isAdmin
        ? [
            {
              label: "Company applications",
              value: companyApplications.filter((application) => !["approved", "rejected"].includes(application.status)).length
            }
          ]
        : []),
      {
        label: "Guide applications",
        value: guideApplications.filter((application) => application.status === "company_approved").length
      },
      { label: "Gallery pending", value: galleryMedia.filter((item) => item.status === "pending").length },
      ...(isAdmin
        ? [
            { label: "Open enquiries", value: enquiries.filter((enquiry) => enquiry.status !== "closed").length },
            { label: "Booking clicks", value: referrals.length },
            { label: "Converted", value: commissionStats.converted }
          ]
        : [])
    ],
    [commissionStats, companyApplications, enquiries, galleryMedia, guideApplications, isAdmin, partners, referrals, tours, users]
  );

  const tabCounts = useMemo(
    () => ({
      overview: crmStats.length,
      referrals: referrals.length,
      users: userPagination.total || users.length,
      "role dashboards": users.length,
      "company applications": companyApplications.length,
      tours: tours.length,
      partners: partners.length,
      "guide applications": guideApplications.length,
      "guide bookings": guideBookings.length,
      "gallery media": galleryMedia.length,
      enquiries: enquiries.length,
      uploads: uploading ? 1 : 0
    }),
    [companyApplications, crmStats.length, enquiries, galleryMedia, guideApplications, guideBookings, partners, referrals, tours, uploading, userPagination.total, users.length]
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
      approved: companyApplications.filter((application) => application.status === "approved").length,
      rejected: companyApplications.filter((application) => application.status === "rejected").length
    }),
    [companyApplications]
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
      title: referral.tour?.title || "Referral click",
      meta: `${referral.converted ? "converted" : "not converted"} - ${formatDate(referral.clickedAt)}`
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
          eyebrow: "Referral activity",
          value: travellerReferrals.length,
          note: "External booking clicks from this account.",
          items: compactList(referralItems, "No referral clicks")
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
          value: users.length,
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
          eyebrow: "Referral clicks",
          value: referrals.length,
          note: "All tracked outbound booking clicks.",
          items: compactList(
            referrals.slice(0, 3).map((referral) => ({
              title: referral.tour?.title || "Referral click",
              meta: `${referral.user?.email || "Guest"} - ${referral.converted ? "converted" : "open"}`
            })),
            "No referrals"
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
        const [userResponse, enquiryResponse, referralResponse, companyApplicationResponse] = await Promise.all([
          getUsers({ limit: ADMIN_USER_PAGE_SIZE, page: 1 }),
          getEnquiries(),
          getReferrals(),
          getTourCompanyApplications()
        ]);

        setUsers(userResponse.data.users);
        setUserPagination({
          ...(userResponse.data.pagination || { page: 1, limit: ADMIN_USER_PAGE_SIZE, total: userResponse.data.users.length, totalPages: 1 }),
          roleCounts: userResponse.data.roleCounts || {}
        });
        setEnquiries(enquiryResponse.data.enquiries);
        setReferrals(referralResponse.data.referrals);
        setCompanyApplications(companyApplicationResponse.data.applications);
      } else {
        setUsers([]);
        setUserPagination({ page: 1, limit: ADMIN_USER_PAGE_SIZE, total: 0, totalPages: 1, roleCounts: {} });
        setEnquiries([]);
        setReferrals([]);
        setCompanyApplications([]);
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
        partnerForm.commissionRatePercent === "" ? 0 : Number(partnerForm.commissionRatePercent),
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
      images: splitLines(tourForm.images),
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
      images: formatListText(tour.images),
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
        await createPartner(serializePartnerForm());
        setToast({ message: "Partner created." });
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
      setToast({ message: "Referral commission updated." });
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

  async function handleTrackingReconcileSubmit(event) {
    event.preventDefault();

    try {
      const { trackingCode, ...payload } = trackingReconcileForm;
      await reconcileReferralByTrackingCode(trackingCode, payload);
      setTrackingReconcileForm(emptyTrackingReconcileForm);
      setToast({ message: "Referral reconciled by tracking code." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function rotatePartnerSecret(id) {
    if (!window.confirm("Rotate this partner postback secret? Their old integration secret will stop working.")) {
      return;
    }

    try {
      await rotatePartnerPostbackSecret(id);
      setToast({ message: "Partner postback secret rotated." });
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

    setUploading(true);

    try {
      const response = await uploadImage(file);
      setTourForm((current) => ({
        ...current,
        images: [current.images, response.data.url].filter(Boolean).join("\n")
      }));
      setToast({ message: "Image uploaded and added to the tour form." });
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

  return (
    <section className={sidebarOpen ? "admin-console sidebar-open" : "admin-console sidebar-collapsed"}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <Link className="admin-brand" to="/">
            <img className="brand-logo admin-brand-logo" src={travellexLogo} alt="Travellex" />
            <span>
              <small>Production CRM</small>
            </span>
          </Link>
          <button
            className="admin-sidebar-toggle sidebar-inner-toggle"
            type="button"
            aria-label={sidebarOpen ? "Close admin sidebar" : "Open admin sidebar"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((current) => !current)}
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
          {tabs.map((tab) => (
            <button
              className={activeTab === tab ? "active" : ""}
              key={tab}
              type="button"
              style={{ "--tab-accent": tabAccentColors[tab] || "var(--admin-accent)" }}
              onClick={() => handleTabChange(tab)}
            >
              <strong>{tabMeta[tab]?.title || tab}</strong>
              <small>{tabCounts[tab] ?? 0}</small>
            </button>
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
          <button
            className="admin-sidebar-toggle"
            type="button"
            aria-label={sidebarOpen ? "Close admin sidebar" : "Open admin sidebar"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
          <div>
            <p className="eyebrow">Admin workspace</p>
            <h1>{activeMeta.title}</h1>
            <span>{activeMeta.description}</span>
          </div>
          <div className="button-row">
            <label className="admin-jump-field">
              <span>Jump to</span>
              <select value={activeTab} onChange={(event) => handleTabChange(event.target.value)}>
                {tabs.map((tab) => (
                  <option key={tab} value={tab}>
                    {tabMeta[tab]?.title || tab} ({tabCounts[tab] ?? 0})
                  </option>
                ))}
              </select>
            </label>
            <Link className="button primary compact" to="/">
              View public site
            </Link>
          </div>
        </header>
        <nav className="admin-folder-tabs" aria-label="Admin folders">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab ? "active" : ""}
              key={tab}
              type="button"
              style={{ "--tab-accent": tabAccentColors[tab] || "var(--admin-accent)" }}
              onClick={() => handleTabChange(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
            >
              <span>{tabMeta[tab]?.title || tab}</span>
              <small>{tabCounts[tab] ?? 0}</small>
            </button>
          ))}
        </nav>
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
                      <strong>{companyApplications.filter((application) => !["approved", "rejected"].includes(application.status)).length}</strong>
                    </div>
                    <div className="admin-metric-row">
                      <span>Guide confirmations</span>
                      <strong>{guideApplications.filter((application) => application.status === "company_approved").length}</strong>
                    </div>
                    <div className="admin-metric-row">
                      <span>Gallery pending</span>
                      <strong>{galleryMedia.filter((item) => item.status === "pending").length}</strong>
                    </div>
                  </article>
                </div>
                <div className="side-panel">
                  <p className="eyebrow">Referral protection</p>
                  <h2>Every partner handoff now carries a Travellex tracking code.</h2>
                  <p>
                    Booking clicks receive a unique code before the traveller lands on the partner website. Use the
                    Referral Commissions tab to reconcile partner bookings, confirmed commission and payouts.
                  </p>
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
                      All users ({allUserRoleCount || userPagination.total || users.length})
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
                    <span className="partner-application-count">{pendingCompanyApplicationItems.length}</span>
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
              <div className="admin-grid">
                <form className="panel-form admin-form" onSubmit={handleTourSubmit}>
                  <h2>{editingTourId ? "Edit tour" : "Add tour"}</h2>
                  <label className="field">
                    <span>Title</span>
                    <input value={tourForm.title} onChange={(event) => updateTourField("title", event.target.value)} required />
                  </label>
                  <label className="field">
                    <span>Short description</span>
                    <input
                      value={tourForm.shortDescription}
                      onChange={(event) => updateTourField("shortDescription", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Description</span>
                    <textarea value={tourForm.description} onChange={(event) => updateTourField("description", event.target.value)} />
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
                      placeholder="Arusha - Tarangire - Ngorongoro - Zanzibar"
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
                    <label className="field">
                      <span>Review rating</span>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={tourForm.reviewRating}
                        onChange={(event) => updateTourField("reviewRating", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Review count</span>
                      <input
                        type="number"
                        min="0"
                        value={tourForm.reviewCount}
                        onChange={(event) => updateTourField("reviewCount", event.target.value)}
                      />
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
                    <span>Partner</span>
                    <select value={tourForm.partner} onChange={(event) => updateTourField("partner", event.target.value)} required>
                      <option value="">Choose partner</option>
                      {partnerOptions.map((partner) => (
                        <option key={partner.value} value={partner.value}>
                          {partner.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Referral link</span>
                    <input value={tourForm.referralLink} onChange={(event) => updateTourField("referralLink", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Tour commission override %</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tourForm.commissionRatePercent}
                      onChange={(event) => updateTourField("commissionRatePercent", event.target.value)}
                      placeholder="Leave blank to use partner rate"
                    />
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
                  {isAdmin && (
                    <div className="vr-admin-panel">
                      <label className="checkbox-inline">
                        <input
                          type="checkbox"
                          checked={tourForm.vrEnabled}
                          onChange={(event) => updateTourField("vrEnabled", event.target.checked)}
                        />
                        Enable VR for this tour
                      </label>
                      <div className="form-grid">
                        <label className="field">
                          <span>VR media type</span>
                          <select value={tourForm.vrMediaType} onChange={(event) => updateTourField("vrMediaType", event.target.value)}>
                            <option value="image">360 image</option>
                            <option value="video">360 video</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>VR media URL</span>
                          <input
                            value={tourForm.vrMediaUrl}
                            onChange={(event) => updateTourField("vrMediaUrl", event.target.value)}
                            placeholder="Image or video URL"
                          />
                        </label>
                      </div>
                      <label className="field">
                        <span>VR caption</span>
                        <input
                          value={tourForm.vrCaption}
                          onChange={(event) => updateTourField("vrCaption", event.target.value)}
                          placeholder="What the traveller is seeing"
                        />
                      </label>
                      <p className="form-note">Only admins can enable VR. Partner media stays normal until Travellex approves it here.</p>
                    </div>
                  )}
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
                  <div className="checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={tourForm.featured}
                        onChange={(event) => updateTourField("featured", event.target.checked)}
                      />
                      Featured
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={tourForm.isActive}
                        onChange={(event) => updateTourField("isActive", event.target.checked)}
                      />
                      Active
                    </label>
                  </div>
                  <div className="button-row">
                    <button className="button primary" type="submit">
                      {editingTourId ? "Update tour" : "Create tour"}
                    </button>
                    {editingTourId && (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => {
                          setEditingTourId("");
                          setTourForm(emptyTour);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                <AdminCollection
                  className="admin-list"
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
                    <article className="admin-row" key={tour._id}>
                      <div>
                        <strong>{tour.title}</strong>
                        {tour.vrEnabled && <span className="tour-vr-admin-status">VR on</span>}
                        <span>
                          {tour.location} - {tour.category} - {eur.format(tour.priceEUR)}
                        </span>
                        <div className="admin-inline-flags">
                          <label>
                            <input
                              type="checkbox"
                              checked={Boolean(tour.featured)}
                              onChange={(event) => handleTourQuickToggle(tour._id, "featured", event.target.checked)}
                            />
                            Featured homepage
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={Boolean(tour.isActive)}
                              onChange={(event) => handleTourQuickToggle(tour._id, "isActive", event.target.checked)}
                            />
                            Public tours
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
                <form className="panel-form admin-form" onSubmit={handlePartnerSubmit}>
                  <h2>{editingPartnerId ? "Edit partner" : "Add partner"}</h2>
                  {Object.keys(emptyPartner)
                    .filter((key) => key !== "isActive")
                    .map((key) => (
                      <label className="field" key={key}>
                        <span>{partnerFieldLabels[key] || key}</span>
                        {["description", "commissionTerms"].includes(key) ? (
                          <textarea value={partnerForm[key]} onChange={(event) => updatePartnerField(key, event.target.value)} />
                        ) : (
                          <input
                            type={["commissionRatePercent", "rating", "reviewCount"].includes(key) ? "number" : "text"}
                            min={["commissionRatePercent", "rating", "reviewCount"].includes(key) ? "0" : undefined}
                            max={key === "commissionRatePercent" ? "100" : key === "rating" ? "5" : undefined}
                            step={key === "rating" ? "0.1" : undefined}
                            value={partnerForm[key]}
                            onChange={(event) => updatePartnerField(key, event.target.value)}
                            required={key === "name"}
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
                  <button className="button primary" type="submit">
                    {editingPartnerId ? "Update partner" : "Create partner"}
                  </button>
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
                    { value: "has-secret", label: "Has postback secret", predicate: (partner) => Boolean(partner.postbackSecret) }
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
                    <article className="admin-row" key={partner._id}>
                      <div>
                        <strong>{partner.name}</strong>
                        <span>
                          {partner.location} - {partner.rating ? `${Number(partner.rating).toFixed(1)} / 5` : "No rating"} - Default commission {partner.commissionRatePercent || 0}%
                        </span>
                        {partner.licenseInfo && <p>{partner.licenseInfo}</p>}
                        <p>{partner.commissionTerms || "No commission terms saved yet."}</p>
                        <div className="postback-box">
                          <p className="eyebrow">Partner postback setup</p>
                          <code>{`${apiBaseURL}/referrals/postback`}</code>
                          <code>{`x-travellex-partner-secret: ${partner.postbackSecret || "Generate by rotating secret"}`}</code>
                          <code>{`{"travellex_ref":"TRACKING_CODE","bookingValueEUR":2000,"partnerBookingId":"BOOKING-123","status":"converted"}`}</code>
                        </div>
                      </div>
                      <div className="button-row">
                        <button className="button secondary compact" type="button" onClick={() => editPartner(partner)}>
                          Edit
                        </button>
                        <button className="button secondary compact" type="button" onClick={() => rotatePartnerSecret(partner._id)}>
                          Rotate secret
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
                items={enquiries}
                label="enquiries"
                emptyText="No enquiries yet."
                searchKeys={["name", "email", "destination", "message", "tour.title", "type", "status"]}
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
              >
                {(enquiry) => (
                  <article className="admin-row" key={enquiry._id}>
                    <div>
                      <strong>{enquiry.name}</strong>
                      <span>
                        {enquiry.email} -{" "}
                        {enquiry.type === "partner_application" ? "Tour listing application" : enquiry.tour?.title || "General"} -{" "}
                        {formatDate(enquiry.createdAt)}
                      </span>
                      {enquiry.destination && <p>Destination: {enquiry.destination}</p>}
                      <p>{enquiry.message}</p>
                    </div>
                    <select value={enquiry.status} onChange={(event) => handleStatusChange(enquiry._id, event.target.value)}>
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="referred">referred</option>
                      <option value="closed">closed</option>
                    </select>
                  </article>
                )}
              </AdminCollection>
            )}
            {activeTab === "referrals" && (
              <div className="admin-list full">
                <div className="admin-kpi-grid compact">
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Tracked clicks</p>
                    <h2>{referrals.length}</h2>
                  </article>
                  <article className="admin-kpi-card">
                    <p className="eyebrow">Converted</p>
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
                    <h2>Reconcile a booking by Travellex tracking code.</h2>
                    <p>
                      Use this when a partner sends a booking report with the traveller&apos;s <strong>travellex_ref</strong>{" "}
                      code from their own booking website.
                    </p>
                  </div>
                  <div className="commission-edit-grid">
                    <label className="field">
                      <span>travellex_ref / tracking code</span>
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
                      <span>Booking EUR</span>
                      <input
                        type="number"
                        min="0"
                        value={trackingReconcileForm.bookingValueEUR}
                        onChange={(event) => updateTrackingReconcileField("bookingValueEUR", event.target.value)}
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Rate %</span>
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
                            {status}
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
                      Reconcile booking
                    </button>
                  </div>
                </form>
                <AdminCollection
                  className="admin-list embedded referral-top-collection"
                  items={referrals}
                  label="referrals"
                  emptyText="No referral clicks tracked yet."
                  searchKeys={["trackingCode", "tour.title", "partner.name", "user.email", "partnerBookingId", "status", "notes"]}
                  filterOptions={[
                    ...referralStatuses.map((status) => ({
                      value: status,
                      label: statusLabel(status),
                      predicate: (referral) => (referral.status || (referral.converted ? "converted" : "clicked")) === status
                    })),
                    { value: "unpaid", label: "Unpaid commission", predicate: (referral) => Number(referral.confirmedCommissionEUR || 0) > Number(referral.paidCommissionEUR || 0) },
                    { value: "guest", label: "Guest clicks", predicate: (referral) => !referral.user }
                  ]}
                  sortOptions={[
                    { value: "newest", label: "Newest", compare: (left, right) => compareDateNewest(left.clickedAt, right.clickedAt) },
                    { value: "tour", label: "Tour A-Z", compare: (left, right) => compareText(left.tour?.title, right.tour?.title) },
                    { value: "partner", label: "Partner A-Z", compare: (left, right) => compareText(left.partner?.name, right.partner?.name) },
                    { value: "confirmed-high", label: "Confirmed high-low", compare: (left, right) => compareNumber(right.confirmedCommissionEUR, left.confirmedCommissionEUR) },
                    { value: "status", label: "Status", compare: (left, right) => compareText(left.status, right.status) }
                  ]}
                  searchPlaceholder="Search tracking code, tour, partner or traveller"
                  pageSize={12}
                >
                  {(referral) => (
                    <article className="admin-row referral-row" key={referral._id}>
                      <div>
                        <strong>{referral.tour?.title || "Tour referral"}</strong>
                        <span>
                          {referral.partner?.name || "Partner"} - {formatDate(referral.clickedAt)} -{" "}
                          {referral.status || (referral.converted ? "converted" : "clicked")}
                        </span>
                        <p>
                          Code: <strong>{referral.trackingCode || "legacy-click"}</strong> - Traveller:{" "}
                          {referral.user?.email || "guest / not logged in"}
                        </p>
                        <p>
                          Estimated: {eur.format(referral.estimatedCommissionEUR || 0)} - Confirmed:{" "}
                          {eur.format(referral.confirmedCommissionEUR || 0)} - Paid:{" "}
                          {eur.format(referral.paidCommissionEUR || 0)}
                        </p>
                        {referral.outboundUrl && (
                          <a href={referral.outboundUrl} target="_blank" rel="noreferrer">
                            Open tracked partner URL
                          </a>
                        )}
                      </div>
                      <div className="commission-edit-grid">
                        <label className="field">
                          <span>Booking EUR</span>
                          <input
                            type="number"
                            min="0"
                            value={referralField(referral, "bookingValueEUR")}
                            onChange={(event) => updateReferralField(referral._id, "bookingValueEUR", event.target.value)}
                          />
                        </label>
                        <label className="field">
                          <span>Rate %</span>
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
                                {status}
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
                          Save commission
                        </button>
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
                  <span>Image file</span>
                  <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                </label>
                <p>
                  Uploaded image URLs are inserted into the tour form so they can be saved into the tour images array.
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
