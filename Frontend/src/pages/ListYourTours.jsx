import { useState } from "react";
import { createTourCompanyApplication } from "../services/applicationService";

const initialForm = {
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  whatsapp: "",
  companyName: "",
  registrationNumber: "",
  licenseNumber: "",
  taxNumber: "",
  website: "",
  bookingURL: "",
  headquarters: "",
  operatingRegions: "",
  tourCategories: "",
  yearsOperating: "",
  hasInHouseGuides: false,
  guideCount: "",
  guideLanguages: "",
  insuranceProvider: "",
  emergencyProcess: "",
  cancellationPolicy: "",
  paymentMethods: "",
  commissionExpectation: "",
  notes: ""
};

const initialTours = [
  { title: "", destination: "", duration: "", estimatedPriceEUR: "", bookingURL: "" },
  { title: "", destination: "", duration: "", estimatedPriceEUR: "", bookingURL: "" },
  { title: "", destination: "", duration: "", estimatedPriceEUR: "", bookingURL: "" }
];

export default function ListYourTours() {
  const [form, setForm] = useState(initialForm);
  const [proposedTours, setProposedTours] = useState(initialTours);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateTour(index, field, value) {
    setProposedTours((current) =>
      current.map((tour, tourIndex) => (tourIndex === index ? { ...tour, [field]: value } : tour))
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      await createTourCompanyApplication({
        ...form,
        proposedTours: proposedTours.filter((tour) => tour.title || tour.destination || tour.bookingURL)
      });
      setStatus("Application sent. FernwehSafari will review it and contact you for a call or WhatsApp discussion.");
      setForm(initialForm);
      setProposedTours(initialTours);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">List your tours</p>
        <h1>Apply to feature your Tanzania and Zanzibar tours.</h1>
      </section>
      <section className="section two-column">
        <div>
          <p className="lead">
            FernwehSafari reviews tour companies before giving posting access. The details below help protect
            travellers, operators and FernwehSafari before any commission agreement or listed tour goes live.
          </p>
          <div className="feature-grid">
            <article>
              <h2>Review</h2>
              <p>FernwehSafari checks company, contact, safety, route and booking information.</p>
            </article>
            <article>
              <h2>Call</h2>
              <p>The team may contact you by email, call or WhatsApp to discuss quality and commission terms.</p>
            </article>
            <article>
              <h2>Access</h2>
              <p>Approved companies receive tour company access and can post tours for admin review.</p>
            </article>
          </div>
        </div>
        <form className="panel-form" onSubmit={handleSubmit}>
          <h2>Applicant details</h2>
          <div className="form-grid">
            <label className="field">
              <span>Contact name</span>
              <input value={form.contactName} onChange={(event) => update("contactName", event.target.value)} required />
            </label>
            <label className="field">
              <span>Role in company</span>
              <input value={form.contactRole} onChange={(event) => update("contactRole", event.target.value)} />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
            </label>
            <label className="field">
              <span>Phone</span>
              <input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
            </label>
            <label className="field">
              <span>WhatsApp</span>
              <input value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} />
            </label>
          </div>

          <h2>Company details</h2>
          <label className="field">
            <span>Company name</span>
            <input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} required />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Registration number</span>
              <input value={form.registrationNumber} onChange={(event) => update("registrationNumber", event.target.value)} />
            </label>
            <label className="field">
              <span>Tour operator licence</span>
              <input value={form.licenseNumber} onChange={(event) => update("licenseNumber", event.target.value)} />
            </label>
            <label className="field">
              <span>Tax number</span>
              <input value={form.taxNumber} onChange={(event) => update("taxNumber", event.target.value)} />
            </label>
            <label className="field">
              <span>Headquarters / city</span>
              <input value={form.headquarters} onChange={(event) => update("headquarters", event.target.value)} required />
            </label>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Website</span>
              <input value={form.website} onChange={(event) => update("website", event.target.value)} />
            </label>
            <label className="field">
              <span>Primary booking URL</span>
              <input value={form.bookingURL} onChange={(event) => update("bookingURL", event.target.value)} />
            </label>
          </div>

          <h2>Operations</h2>
          <label className="field">
            <span>Operating regions</span>
            <input
              value={form.operatingRegions}
              onChange={(event) => update("operatingRegions", event.target.value)}
              placeholder="Ngorongoro, Arusha, Kilimanjaro, Zanzibar..."
              required
            />
          </label>
          <label className="field">
            <span>Tour categories</span>
            <input
              value={form.tourCategories}
              onChange={(event) => update("tourCategories", event.target.value)}
              placeholder="Safari, beach, mountain, cultural..."
              required
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Years operating</span>
              <input value={form.yearsOperating} onChange={(event) => update("yearsOperating", event.target.value)} />
            </label>
            <label className="field">
              <span>Payment methods</span>
              <input value={form.paymentMethods} onChange={(event) => update("paymentMethods", event.target.value)} />
            </label>
          </div>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={form.hasInHouseGuides}
              onChange={(event) => update("hasInHouseGuides", event.target.checked)}
            />
            Company has in-house tour guides
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Guide count</span>
              <input value={form.guideCount} onChange={(event) => update("guideCount", event.target.value)} />
            </label>
            <label className="field">
              <span>Guide languages</span>
              <input value={form.guideLanguages} onChange={(event) => update("guideLanguages", event.target.value)} />
            </label>
          </div>

          <h2>Safety and terms</h2>
          <label className="field">
            <span>Insurance provider / coverage</span>
            <input value={form.insuranceProvider} onChange={(event) => update("insuranceProvider", event.target.value)} />
          </label>
          <label className="field">
            <span>Emergency process</span>
            <textarea value={form.emergencyProcess} onChange={(event) => update("emergencyProcess", event.target.value)} rows="3" />
          </label>
          <label className="field">
            <span>Cancellation policy</span>
            <textarea value={form.cancellationPolicy} onChange={(event) => update("cancellationPolicy", event.target.value)} rows="3" />
          </label>
          <label className="field">
            <span>Commission expectation</span>
            <input
              value={form.commissionExpectation}
              onChange={(event) => update("commissionExpectation", event.target.value)}
              placeholder="Example: open to discussion, 10%, 15%..."
            />
          </label>

          <h2>Example tours</h2>
          {proposedTours.map((tour, index) => (
            <div className="side-panel compact-panel" key={index}>
              <strong>Tour {index + 1}</strong>
              <label className="field">
                <span>Title</span>
                <input value={tour.title} onChange={(event) => updateTour(index, "title", event.target.value)} />
              </label>
              <div className="form-grid">
                <label className="field">
                  <span>Destination</span>
                  <input value={tour.destination} onChange={(event) => updateTour(index, "destination", event.target.value)} />
                </label>
                <label className="field">
                  <span>Duration</span>
                  <input value={tour.duration} onChange={(event) => updateTour(index, "duration", event.target.value)} />
                </label>
                <label className="field">
                  <span>Estimated price EUR</span>
                  <input
                    value={tour.estimatedPriceEUR}
                    onChange={(event) => updateTour(index, "estimatedPriceEUR", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Existing booking URL</span>
                  <input value={tour.bookingURL} onChange={(event) => updateTour(index, "bookingURL", event.target.value)} />
                </label>
              </div>
            </div>
          ))}

          <label className="field">
            <span>Additional notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Tell us anything important about your routes, licences, vehicles, guide standards or preferred commission discussion."
              rows="5"
            />
          </label>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Submit application"}
          </button>
          {status && <p className="form-note">{status}</p>}
        </form>
      </section>
    </>
  );
}
