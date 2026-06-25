import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { createTourCompanyApplication } from "../services/applicationService";

const steps = [
  { key: "companyName", label: "Company Name", placeholder: "Example: Kilimanjaro Coast Adventures" },
  { key: "tourTypes", label: "Tour Types Offered", placeholder: "Safari, mountain, beach, culture, adventure..." },
  { key: "email", label: "Contact Email", placeholder: "partnerships@example.com" }
];

const benefits = [
  ["High Traffic", "Reach travellers already searching for Africa tours, safari routes, coast trips and adventure travel."],
  ["Fair Commissions", "Agree referral percentages before any tour goes public."],
  ["Marketing Exposure", "Show routes with vivid destination storytelling and local imagery."],
  ["Zero Sign-Up Fees", "Apply first, talk terms, then post only after approval."]
];

export default function ListYourTours() {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({ companyName: "", tourTypes: "", email: "" });
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isTourCompany = user?.role === "tour_company";
  const currentStep = steps[stepIndex];
  const canGoNext = form[currentStep.key]?.trim();

  function update(value) {
    setForm((current) => ({ ...current, [currentStep.key]: value }));
  }

  async function submitApplication() {
    setSubmitting(true);
    setStatus("");

    try {
      await createTourCompanyApplication({
        companyName: form.companyName,
        contactName: form.companyName,
        email: form.email,
        headquarters: "To be discussed",
        operatingRegions: form.tourTypes,
        tourCategories: form.tourTypes,
        commissionExpectation: "Open to discussion"
      });
      setStatus("Application received. Travellex will contact you to review fit and commission terms.");
      setForm({ companyName: "", tourTypes: "", email: "" });
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
          <h2>Three quick details start the conversation.</h2>
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
            <label className="field">
              <span>{currentStep.label}</span>
              <input
                type={currentStep.key === "email" ? "email" : "text"}
                value={form[currentStep.key]}
                onChange={(event) => update(event.target.value)}
                placeholder={currentStep.placeholder}
                required
              />
            </label>
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
