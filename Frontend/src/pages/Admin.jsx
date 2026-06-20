import { useEffect, useMemo, useState } from "react";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import {
  createPartner,
  deletePartner,
  getPartners,
  updatePartner
} from "../services/partnerService";
import {
  createTour,
  deleteTour,
  getTours,
  updateTour
} from "../services/tourService";
import { getEnquiries, updateEnquiryStatus } from "../services/enquiryService";
import { getReferrals, markReferralConverted } from "../services/referralService";
import { uploadImage } from "../services/uploadService";
import { eur, formatDate } from "../utils/formatters";

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

export default function Admin() {
  const [activeTab, setActiveTab] = useState("tours");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [tours, setTours] = useState([]);
  const [partners, setPartners] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [tourForm, setTourForm] = useState(emptyTour);
  const [editingTourId, setEditingTourId] = useState("");
  const [partnerForm, setPartnerForm] = useState(emptyPartner);
  const [editingPartnerId, setEditingPartnerId] = useState("");
  const [uploading, setUploading] = useState(false);

  const partnerOptions = useMemo(
    () => partners.map((partner) => ({ value: partner._id, label: partner.name })),
    [partners]
  );

  async function loadAdminData() {
    setLoading(true);
    try {
      const [tourResponse, partnerResponse, enquiryResponse, referralResponse] = await Promise.all([
        getTours({ includeInactive: true }),
        getPartners({ includeInactive: true }),
        getEnquiries(),
        getReferrals()
      ]);

      setTours(tourResponse.data.tours);
      setPartners(partnerResponse.data.partners);
      setEnquiries(enquiryResponse.data.enquiries);
      setReferrals(referralResponse.data.referrals);
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  function updateTourField(field, value) {
    setTourForm((current) => ({ ...current, [field]: value }));
  }

  function updatePartnerField(field, value) {
    setPartnerForm((current) => ({ ...current, [field]: value }));
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
      <section className="page-hero compact-hero">
        <p className="eyebrow">Admin</p>
        <h1>Manage tours, partners, enquiries and referrals.</h1>
      </section>
      <section className="section admin-section">
        <div className="tab-row">
          {["tours", "partners", "enquiries", "referrals", "uploads"].map((tab) => (
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
                        {enquiry.email} · {enquiry.tour?.title || "General"} · {formatDate(enquiry.createdAt)}
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
