import { useState } from "react";
import { createEnquiry } from "../services/enquiryService";
import { destinationOptions } from "../utils/travelOptions";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", destination: "", message: "" });
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      await createEnquiry({
        name: form.name,
        email: form.email,
        destination: form.destination.trim(),
        message: `Destination or route of interest: ${form.destination.trim()}\n\n${form.message}`
      });
      setStatus("Thanks. Travellex will follow up with the right next step.");
      setForm({ name: "", email: "", destination: "", message: "" });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="page-hero compact-hero contact-hero">
        <p className="eyebrow">Contact</p>
        <h1>Fast touchpoints for Africa travel questions.</h1>
      </section>
      <section className="section contact-action-layout">
        <a className="touch-action whatsapp" href="https://wa.me/4917676062927" target="_blank" rel="noreferrer">
          <span>💬</span>
          Chat on WhatsApp
        </a>
        <a className="touch-action email" href="mailto:experience@travellex.tours">
          <span>✉️</span>
          experience@travellex.tours
        </a>
      </section>
      <section className="section narrow">
        <form className="panel-form minimal-contact-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
          </label>
          <label className="field">
            <span>Destination / Route in Africa</span>
            <input
              list="africa-destination-options"
              value={form.destination}
              onChange={(event) => update("destination", event.target.value)}
              placeholder="Type any country, city, route or experience in Africa"
              required
            />
            <datalist id="africa-destination-options">
              {destinationOptions.map((destination) => (
                <option key={destination} value={destination} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>Message</span>
            <textarea
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              placeholder="Tell us your dates, group size, travel style, budget range or the question you want Travellex to answer."
              rows="5"
              required
            />
          </label>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send enquiry"}
          </button>
          {status && <p className="form-note">{status}</p>}
        </form>
      </section>
    </>
  );
}
