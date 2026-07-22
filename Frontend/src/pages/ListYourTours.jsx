import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import useAuth from "../hooks/useAuth";
import { createTourCompanyApplication } from "../services/applicationService";

const steps = [
  {
    key: "company",
    fields: [
      { key: "companyName", label: "Company name", placeholder: "Example: Kilimanjaro Coast Adventures" },
      { key: "contactName", label: "Contact person", placeholder: "Full name" },
      { key: "email", label: "Contact email", placeholder: "partnerships@example.com", type: "email" }
    ]
  },
  {
    key: "contact",
    fields: [
      { key: "phone", label: "Phone", placeholder: "+255..." },
      { key: "whatsapp", label: "WhatsApp", placeholder: "+255..." }
    ]
  },
  {
    key: "coverage",
    fields: [
      { key: "headquarters", label: "Location", placeholder: "City, country" },
      { key: "operatingRegions", label: "Regions", placeholder: "Tanzania, Zanzibar, Kenya, all..." }
    ]
  },
  {
    key: "operations",
    fields: [
      { key: "tourTypes", label: "Tour types offered", placeholder: "Safari, mountain, beach, culture, adventure..." },
      {
        key: "hasInHouseGuides",
        label: "Has in-house guides",
        type: "select",
        options: [
          { value: "", label: "Choose one" },
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ]
      }
    ]
  }
];

const initialPartnerApplication = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  whatsapp: "",
  headquarters: "",
  operatingRegions: "",
  tourTypes: "",
  hasInHouseGuides: ""
};

const benefits = [
  ["High Traffic", "Reach travellers already searching for Africa tours, safari routes, coast trips and adventure travel."],
  ["Fair Commissions", "Agree referral percentages before any tour goes public."],
  ["Marketing Exposure", "Show routes with vivid destination storytelling and local imagery."],
  ["Zero Sign-Up Fees", "Apply first, talk terms, then post only after approval."]
];

export default function ListYourTours() {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(initialPartnerApplication);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isTourCompany = user?.role === "tour_company";
  const currentStep = steps[stepIndex];
  const canGoNext = currentStep.fields.every((field) => String(form[field.key] || "").trim());

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitApplication() {
    setSubmitting(true);
    setStatus("");

    try {
      await createTourCompanyApplication({
        companyName: form.companyName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        headquarters: form.headquarters,
        operatingRegions: form.operatingRegions,
        tourCategories: form.tourTypes,
        hasInHouseGuides: form.hasInHouseGuides === "true",
        commissionExpectation: "Open to discussion"
      });
      setStatus("Application received. Travellex will contact you to review fit and commission terms.");
      setForm(initialPartnerApplication);
      setStepIndex(0);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (stepIndex < steps.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    submitApplication();
  }

  return (
    <>
      <SEO
        canonicalPath="/partner"
        description="Tour companies can apply to list Africa tours on Travellex, reaching travellers searching for Tanzania, Zanzibar, safari, coast, culture and adventure routes."
        keywords={["list Africa tours", "tour operator marketplace", "Travellex partner", "Tanzania tour company", "Zanzibar tour operator"]}
        title="List Africa Tours With Travellex"
      />
      <section className="partner-pitch-hero">
        <div>
          <p className="eyebrow">Partner & referral program</p>
          <h1>List Your Africa Tours With Us.</h1>
          <p>
            Travellex helps trusted operators turn local routes into clear, visual discovery pages for travellers
            planning Africa tours and adventure trips.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to={isTourCompany ? "/dashboard" : "/login"}>
              {isTourCompany ? "List tours" : "Login as partner"}
            </Link>
            {!isTourCompany && (
              <a className="button secondary light" href="#partner-application">
                Become a partner
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="benefits-matrix">
          {benefits.map(([title, text]) => (
            <article key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section partner-intro" id="partner-application">
        <div>
          <p className="eyebrow">Simple onboarding</p>
          <h2>Partner details start the conversation.</h2>
          <p className="lead">
            After the lead form, Travellex reviews the company, schedules a call or WhatsApp discussion, and only
            approved tour companies receive dashboard access to post listings for staff review.
          </p>
        </div>
        {isTourCompany ? (
          <div className="partner-action-card">
            <p className="eyebrow">Approved company</p>
            <h2>Your listing flow is in the dashboard.</h2>
            <p>Add route details, prices, images and referral booking URLs for Travellex staff approval.</p>
            <Link className="button primary" to="/dashboard">
              List tours
            </Link>
          </div>
        ) : (
          <form className="partner-step-form" onSubmit={handleSubmit}>
            <div className="step-progress">
              {steps.map((step, index) => (
                <span className={index <= stepIndex ? "active" : ""} key={step.key}>
                  {index + 1}
                </span>
              ))}
            </div>
            <div className="partner-step-fields">
              {currentStep.fields.map((field) => (
                <label className="field" key={field.key}>
                  <span>{field.label}</span>
                  {field.type === "select" ? (
                    <select value={form[field.key]} onChange={(event) => update(field.key, event.target.value)} required>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={form[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      required
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="button-row">
              {stepIndex > 0 && (
                <button className="button secondary" type="button" onClick={() => setStepIndex((current) => current - 1)}>
                  Back
                </button>
              )}
              <button className="button primary" type="submit" disabled={!canGoNext || submitting}>
                {submitting ? "Sending..." : stepIndex === steps.length - 1 ? "Submit partner lead" : "Continue"}
              </button>
            </div>
            {status && <p className="form-note">{status}</p>}
          </form>
        )}
      </section>
    </>
  );
}
