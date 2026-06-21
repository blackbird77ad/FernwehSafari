import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import useAuth from "../hooks/useAuth";
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
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  updateUserRole
} from "../services/userService";
import { eur, formatDate } from "../utils/formatters";

const userRoles = ["traveller", "tour_company", "tour_guide", "moderator", "admin"];

const roleLabels = {
  traveller: "Traveller",
  tour_company: "Tour company",
  tour_guide: "Tour guide",
  moderator: "Moderator",
  admin: "Admin"
};

const referralStatuses = ["clicked", "converted", "paid", "cancelled", "disputed"];

const partnerFieldLabels = {
  name: "Partner name",
  bookingURL: "Default booking URL",
  location: "Location",
  contactEmail: "Contact email",
  contactPhone: "Contact phone",
  description: "Partner description",
  logo: "Logo URL",
  commissionRatePercent: "Default commission %",
  commissionTerms: "Commission terms"
};

const tabMeta = {
  overview: {
    icon: "📊",
    title: "Analytics",
    description: "Production numbers, commission pipeline and operational queues."
  },
  referrals: {
    icon: "💶",
    title: "Referral Commissions",
    description: "Track outbound booking clicks, partner codes, conversion status and earned commission."
  },
  users: {
    icon: "👥",
    title: "Users",
    description: "Search, promote and manage traveller, partner, guide, moderator and admin accounts."
  },
  "role dashboards": {
    icon: "🧭",
    title: "Role Dashboards",
    description: "Preview what each account type is doing without changing login sessions."
  },
  "company applications": {
    icon: "🤝",
    title: "Partner Applications",
    description: "Review tour company applications and move approved operators into the partner system."
  },
  tours: {
    icon: "🗺️",
    title: "Tours",
    description: "Approve, edit and publish the tour inventory that powers the public site."
  },
  partners: {
    icon: "🏢",
    title: "Partners",
    description: "Manage partner booking URLs, commission rates and commercial terms."
  },
  "guide applications": {
    icon: "🥾",
    title: "Guide Applications",
    description: "Confirm company-approved tour guides before they appear on tours."
  },
  "guide bookings": {
    icon: "📅",
    title: "Guide Bookings",
    description: "Monitor traveller requests sent to approved tour guides."
  },
  "gallery media": {
    icon: "🖼️",
    title: "Gallery Media",
    description: "Approve, schedule, switch off and remove public travel media."
  },
  enquiries: {
    icon: "✉️",
    title: "Enquiries",
    description: "Track public questions and traveller contact requests."
  },
  uploads: {
    icon: "☁️",
    title: "Uploads",
    description: "Add Cloudinary media into tour and gallery workflows."
  }
};

const emptyTour = {
  title: "",
  shortDescription: "",
  description: "",
  priceEUR: "",
  duration: "",
  location: "",
  category: "Safari",
  partner: "",
  referralLink: "",
  commissionRatePercent: "",
  images: "",
  highlights: "",
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

export default function Admin() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [users, setUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [partners, setPartners] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [companyApplications, setCompanyApplications] = useState([]);
  const [guideApplications, setGuideApplications] = useState([]);
  const [guideBookings, setGuideBookings] = useState([]);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [tourForm, setTourForm] = useState(emptyTour);
  const [editingTourId, setEditingTourId] = useState("");
  const [partnerForm, setPartnerForm] = useState(emptyPartner);
  const [editingPartnerId, setEditingPartnerId] = useState("");
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState("");
  const [previewUserId, setPreviewUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 1, roleCounts: {} });
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

  const visibleUsers = useMemo(() => filteredUsers.slice(0, 100), [filteredUsers]);

  const usersByRole = useMemo(
    () =>
      userRoles.map((role) => ({
        role,
        label: roleLabels[role],
        count: userPagination.roleCounts?.[role] || 0
      })),
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
          getUsers({ limit: 100, page: 1 }),
          getEnquiries(),
          getReferrals(),
          getTourCompanyApplications()
        ]);

        setUsers(userResponse.data.users);
        setUserPagination({
          ...(userResponse.data.pagination || { page: 1, limit: 100, total: userResponse.data.users.length, totalPages: 1 }),
          roleCounts: userResponse.data.roleCounts || {}
        });
        setEnquiries(enquiryResponse.data.enquiries);
        setReferrals(referralResponse.data.referrals);
        setCompanyApplications(companyApplicationResponse.data.applications);
      } else {
        setUsers([]);
        setUserPagination({ page: 1, limit: 100, total: 0, totalPages: 1, roleCounts: {} });
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
    const params = {
      limit: userPagination.limit || 100,
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
        partnerForm.commissionRatePercent === "" ? 0 : Number(partnerForm.commissionRatePercent)
    };
  }

  function serializeTourForm() {
    return {
      ...tourForm,
      priceEUR: Number(tourForm.priceEUR),
      commissionRatePercent:
        tourForm.commissionRatePercent === "" ? undefined : Number(tourForm.commissionRatePercent),
      images: tourForm.images
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      highlights: tourForm.highlights
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      itinerary: []
    };
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
      duration: tour.duration || "",
      location: tour.location || "",
      category: tour.category || "Safari",
      partner: tour.partner?._id || tour.partner || "",
      referralLink: tour.referralLink || "",
      commissionRatePercent: tour.commissionRatePercent ?? "",
      images: (tour.images || []).join("\n"),
      highlights: (tour.highlights || []).join("\n"),
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
      await loadAdminData();
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
    const reviewNotes = window.prompt("Review notes for this gallery decision?") || "";

    try {
      await reviewGalleryMedia(id, { status, reviewNotes });
      setToast({ message: `Gallery media ${status}.` });
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
    setActiveTab("users");
  }

  async function handleUserRoleChange(id, role) {
    try {
      await updateUserRole(id, role);
      setToast({ message: "User role updated." });
      await loadAdminData();
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  async function removeUser(id) {
    try {
      await deleteUser(id);
      setToast({ message: "User deleted." });
      await loadAdminData();
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
    const reviewNotes = window.prompt("Review notes for this decision?") || "";

    try {
      await updateTourCompanyApplicationStatus(id, { status, reviewNotes });
      setToast({ message: `Company application ${status}.` });
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
    const notes = window.prompt("Admin notes for this guide decision?") || "";

    try {
      await decideGuideApplicationByAdmin(id, { decision, notes });
      setToast({ message: `Guide application ${decision}.` });
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

  const activeMeta = tabMeta[activeTab] || { icon: "⚙️", title: activeTab, description: "Manage FernwehSafari." };

  return (
    <section className="admin-console">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/">
          <span className="brand-mark">FS</span>
          <span>
            FernwehSafari
            <small>Production CRM</small>
          </span>
        </Link>
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
              onClick={() => setActiveTab(tab)}
            >
              <span>{tabMeta[tab]?.icon || "•"}</span>
              <strong>{tabMeta[tab]?.title || tab}</strong>
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
      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">{activeMeta.icon} Admin workspace</p>
            <h1>{activeMeta.title}</h1>
            <span>{activeMeta.description}</span>
          </div>
          <div className="button-row">
            <Link className="button secondary compact" to="/dashboard">
              Open role dashboard
            </Link>
            <Link className="button primary compact" to="/">
              View public site
            </Link>
          </div>
        </header>
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
                  <h2>Every partner handoff now carries a Fernweh tracking code.</h2>
                  <p>
                    Booking clicks receive a unique code before the traveller lands on the partner website. Use the
                    Referral Commissions tab to reconcile partner bookings, confirmed commission and payouts.
                  </p>
                </div>
              </div>
            )}
            {activeTab === "users" && (
              <div className="admin-grid">
                <form className="panel-form admin-form" onSubmit={handleUserSubmit}>
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
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                <div className="admin-list">
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
                      <span>Role filter</span>
                      <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
                        <option value="all">All roles</option>
                        {userRoles.map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="button primary compact" type="button" onClick={() => loadUsersForFilters(1)}>
                      Search
                    </button>
                    <p className="form-note">
                      Showing {visibleUsers.length} of {userPagination.total} matching users. Page {userPagination.page} of{" "}
                      {userPagination.totalPages}.
                    </p>
                  </div>
                  {visibleUsers.map((user) => (
                    <article className="admin-row" key={user.id}>
                      <div>
                        <strong>{user.name}</strong>
                        <span>
                          {user.email} - {roleLabels[user.role] || user.role} - {user.country || "No country"}
                        </span>
                      </div>
                      <div className="button-row">
                        <label className="inline-role-select">
                          <span>Promote role</span>
                          <select
                            aria-label={`Promote ${user.name} role`}
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
                        <button className="button danger compact" type="button" onClick={() => removeUser(user.id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {filteredUsers.length > visibleUsers.length && (
                    <p className="empty-state">Refine search to load a smaller working set from {filteredUsers.length} matches.</p>
                  )}
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
              <div className="admin-list full">
                {companyApplications.map((application) => (
                  <article className="admin-row" key={application._id}>
                    <div>
                      <strong>{application.companyName}</strong>
                      <span>
                        {application.contactName} - {application.email} - {application.status}
                      </span>
                      <p>
                        {application.headquarters} - Regions: {application.operatingRegions?.join(", ") || "Not provided"} -
                        Guides: {application.hasInHouseGuides ? "In-house" : "External/none listed"}
                      </p>
                      <p>{application.notes || "No notes provided."}</p>
                    </div>
                    <div className="button-row">
                      <a className="button secondary compact" href={`mailto:${application.email}`}>
                        Email
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
                      <button
                        className="button secondary compact"
                        type="button"
                        onClick={() => handleCompanyApplicationStatus(application._id, "call_scheduled")}
                      >
                        Call scheduled
                      </button>
                      <button
                        className="button primary compact"
                        type="button"
                        onClick={() => handleCompanyApplicationStatus(application._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="button danger compact"
                        type="button"
                        onClick={() => handleCompanyApplicationStatus(application._id, "rejected")}
                      >
                        Reject
                      </button>
                      <button className="button danger compact" type="button" onClick={() => removeCompanyApplication(application._id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {activeTab === "guide applications" && (
              <div className="admin-list full">
                {guideApplications.map((application) => (
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
                        Email
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
                        Confirm guide
                      </button>
                      <button
                        className="button danger compact"
                        type="button"
                        onClick={() => handleGuideAdminDecision(application._id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {activeTab === "guide bookings" && (
              <div className="admin-list full">
                {guideBookings.map((booking) => (
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
                ))}
              </div>
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
                <div className="admin-list">
                  {galleryMedia.map((item) => (
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
                          Approve
                        </button>
                        <button className="button secondary compact" type="button" onClick={() => handleGalleryReview(item._id, "pending")}>
                          Pending
                        </button>
                        <button className="button danger compact" type="button" onClick={() => handleGalleryReview(item._id, "rejected")}>
                          Reject
                        </button>
                        <button className="button danger compact" type="button" onClick={() => removeGalleryMedia(item._id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
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
                      <span>Duration</span>
                      <input value={tourForm.duration} onChange={(event) => updateTourField("duration", event.target.value)} required />
                    </label>
                    <label className="field">
                      <span>Location</span>
                      <input value={tourForm.location} onChange={(event) => updateTourField("location", event.target.value)} required />
                    </label>
                    <label className="field">
                      <span>Category</span>
                      <select value={tourForm.category} onChange={(event) => updateTourField("category", event.target.value)}>
                        <option>Safari</option>
                        <option>Beach</option>
                        <option>Cultural</option>
                        <option>Mountain</option>
                        <option>Combination</option>
                      </select>
                    </label>
                  </div>
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
                    <span>Highlights, one per line</span>
                    <textarea value={tourForm.highlights} onChange={(event) => updateTourField("highlights", event.target.value)} />
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
                <div className="admin-list">
                  {tours.map((tour) => (
                    <article className="admin-row" key={tour._id}>
                      <div>
                        <strong>{tour.title}</strong>
                        <span>
                          {tour.location} · {tour.category} · {eur.format(tour.priceEUR)}
                        </span>
                      </div>
                      <div className="button-row">
                        <button className="button secondary compact" type="button" onClick={() => editTour(tour)}>
                          Edit
                        </button>
                        <button className="button danger compact" type="button" onClick={() => removeTour(tour._id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
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
                            type={key === "commissionRatePercent" ? "number" : "text"}
                            min={key === "commissionRatePercent" ? "0" : undefined}
                            max={key === "commissionRatePercent" ? "100" : undefined}
                            value={partnerForm[key]}
                            onChange={(event) => updatePartnerField(key, event.target.value)}
                            required={key === "name" || key === "bookingURL"}
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
                <div className="admin-list">
                  {partners.map((partner) => (
                    <article className="admin-row" key={partner._id}>
                      <div>
                        <strong>{partner.name}</strong>
                        <span>
                          {partner.location} - Default commission {partner.commissionRatePercent || 0}%
                        </span>
                        <p>{partner.commissionTerms || "No commission terms saved yet."}</p>
                        <div className="postback-box">
                          <p className="eyebrow">Partner postback setup</p>
                          <code>{`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/referrals/postback`}</code>
                          <code>{`x-fernweh-partner-secret: ${partner.postbackSecret || "Generate by rotating secret"}`}</code>
                          <code>{`{"fernweh_ref":"TRACKING_CODE","bookingValueEUR":2000,"partnerBookingId":"BOOKING-123","status":"converted"}`}</code>
                        </div>
                      </div>
                      <div className="button-row">
                        <button className="button secondary compact" type="button" onClick={() => editPartner(partner)}>
                          Edit
                        </button>
                        <button className="button secondary compact" type="button" onClick={() => rotatePartnerSecret(partner._id)}>
                          Rotate secret
                        </button>
                        <button className="button danger compact" type="button" onClick={() => removePartner(partner._id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "enquiries" && (
              <div className="admin-list full">
                {enquiries.map((enquiry) => (
                  <article className="admin-row" key={enquiry._id}>
                    <div>
                      <strong>{enquiry.name}</strong>
                      <span>
                        {enquiry.email} -{" "}
                        {enquiry.type === "partner_application" ? "Tour listing application" : enquiry.tour?.title || "General"} -{" "}
                        {formatDate(enquiry.createdAt)}
                      </span>
                      <p>{enquiry.message}</p>
                    </div>
                    <select value={enquiry.status} onChange={(event) => handleStatusChange(enquiry._id, event.target.value)}>
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="referred">referred</option>
                      <option value="closed">closed</option>
                    </select>
                  </article>
                ))}
              </div>
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
                    <h2>Reconcile a booking by Fernweh tracking code.</h2>
                    <p>
                      Use this when a partner sends a booking report with the traveller&apos;s <strong>fernweh_ref</strong>{" "}
                      code from their own booking website.
                    </p>
                  </div>
                  <div className="commission-edit-grid">
                    <label className="field">
                      <span>fernweh_ref / tracking code</span>
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
                {referrals.map((referral) => (
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
                ))}
                {!referrals.length && <p className="empty-state">No referral clicks tracked yet.</p>}
              </div>
            )}
            {activeTab === "referrals-old" && (
              <div className="admin-list full">
                {referrals.map((referral) => (
                  <article className="admin-row" key={referral._id}>
                    <div>
                      <strong>{referral.tour?.title}</strong>
                      <span>
                        {referral.partner?.name} · {formatDate(referral.clickedAt)} ·{" "}
                        {referral.converted ? "Converted" : "Pending"}
                      </span>
                    </div>
                    {!referral.converted && (
                      <button className="button primary compact" type="button" onClick={() => handleReferralConversion(referral._id)}>
                        Mark converted
                      </button>
                    )}
                  </article>
                ))}
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
                  Uploaded image URLs are inserted into the tour form so they can be saved into a tour’s images array.
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
