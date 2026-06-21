import { useState } from "react";
import { createEnquiry } from "../services/enquiryService";
import { destinationStories } from "../utils/staticContent";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", destination: "" });
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
        message: `Destination of interest: ${form.destination}`
      });
      setStatus("Thanks. FernwehSafari will follow up with the right next step.");
      setForm({ name: "", email: "", destination: "" });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">Contact</p>
        <h1>Fast touchpoints for Tanzania and Zanzibar travel questions.</h1>
      </section>
      <section className="section contact-action-layout">
        <a className="touch-action whatsapp" href="https://wa.me/4917676062927" target="_blank" rel="noreferrer">
          <span>💬</span>
          Chat on WhatsApp
        </a>
        <a className="touch-action email" href="mailto:msamilashalom@gmail.com">
          <span>✉️</span>
          Email Our Team
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
            <span>Destination of Interest</span>
            <select value={form.destination} onChange={(event) => update("destination", event.target.value)} required>
              <option value="">Select destination</option>
              {destinationStories.map((story) => (
                <option key={story.name} value={story.name}>
                  {story.name}
                </option>
              ))}
            </select>
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
