import { useCallback, useEffect, useMemo, useState } from "react";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import useAuth from "../hooks/useAuth";
import {
  createPartner,
  deletePartner,
  getPartners,
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
import { getReferrals, markReferralConverted } from "../services/referralService";
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

export default function Admin() {
  const { user } = useAuth();
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
      ...(isAdmin ? ["users", "company applications"] : []),
      ...(isStaff ? ["guide applications", "guide bookings", "gallery media", "tours", "uploads"] : []),
      ...(isAdmin ? ["partners", "enquiries", "referrals"] : [])
    ],
    [isAdmin, isStaff]
  );

  const crmStats = useMemo(
    () => [
      ...(isAdmin ? [{ label: "Users", value: users.length }] : []),
      { label: "Tours", value: tours.length },
      { label: "Operators", value: partners.length },
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
            { label: "Converted", value: referrals.filter((referral) => referral.converted).length }
          ]
        : [])
    ],
    [companyApplications, enquiries, galleryMedia, guideApplications, isAdmin, partners, referrals, tours, users]
  );

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
          getUsers(),
          getEnquiries(),
          getReferrals(),
          getTourCompanyApplications()
        ]);

        setUsers(userResponse.data.users);
        setEnquiries(enquiryResponse.data.enquiries);
        setReferrals(referralResponse.data.referrals);
        setCompanyApplications(companyApplicationResponse.data.applications);
      } else {
        setUsers([]);
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

  function serializeTourForm() {
    return {
      ...tourForm,
      priceEUR: Number(tourForm.priceEUR),
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
        await updatePartner(editingPartnerId, partnerForm);
        setToast({ message: "Partner updated." });
      } else {
        await createPartner(partnerForm);
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
    try {
      await markReferralConverted(id);
      setToast({ message: "Referral marked converted." });
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

  return (
    <>
      <section className="page-hero compact-hero admin-hero">
        <p className="eyebrow">Staff CRM</p>
        <h1>Review the travel marketplace without losing sight of the traveller journey.</h1>
      </section>
      <section className="section admin-section">
        <div className="tab-row">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab ? "active" : ""}
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="admin-list full">
                <div className="card-grid">
                  {crmStats.map((item) => (
                    <article className="side-panel" key={item.label}>
                      <p className="eyebrow">{item.label}</p>
                      <h2>{item.value}</h2>
                    </article>
                  ))}
                </div>
                <div className="side-panel">
                  <p className="eyebrow">CRM workflow</p>
                  <h2>Manage the whole FernwehSafari pipeline.</h2>
                  <p>
                    Create user accounts, promote roles, review tour listing applications, manage operators, publish
                    tours, track enquiries and mark successful referral conversions.
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
                  {users.map((user) => (
                    <article className="admin-row" key={user.id}>
                      <div>
                        <strong>{user.name}</strong>
                        <span>
                          {user.email} - {roleLabels[user.role] || user.role} - {user.country || "No country"}
                        </span>
                      </div>
                      <div className="button-row">
                        <select value={user.role} onChange={(event) => handleUserRoleChange(user.id, event.target.value)}>
                          {userRoles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                        <button className="button secondary compact" type="button" onClick={() => editUser(user)}>
                          Edit
                        </button>
                        <button className="button danger compact" type="button" onClick={() => removeUser(user.id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
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
                        <span>{key}</span>
                        {key === "description" ? (
                          <textarea value={partnerForm[key]} onChange={(event) => updatePartnerField(key, event.target.value)} />
                        ) : (
                          <input
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
                        <span>{partner.location}</span>
                      </div>
                      <div className="button-row">
                        <button className="button secondary compact" type="button" onClick={() => editPartner(partner)}>
                          Edit
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
      </section>
      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </>
  );
}
