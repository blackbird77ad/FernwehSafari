import { useState } from "react";
import { createEnquiry } from "../services/enquiryService";
import useAuth from "../hooks/useAuth";

export default function EnquiryForm({ tour }) {
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    message: ""
  });
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
        ...form,
        tour: tour?._id
      });
      setStatus("Enquiry sent. FernwehSafari will follow up with next steps.");
      setForm({
        name: isAuthenticated ? user?.name || "" : "",
        email: isAuthenticated ? user?.email || "" : "",
        message: ""
      });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
      </label>
      {tour && (
        <label className="field">
          <span>Tour</span>
          <input value={tour.title} readOnly />
        </label>
      )}
      <label className="field">
        <span>Message</span>
        <textarea
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder="Tell us your travel dates, group size and questions."
          rows="5"
        />
      </label>
      <button className="button primary" type="submit" disabled={submitting}>
        {submitting ? "Sending..." : "Submit enquiry"}
      </button>
      {status && <p className="form-note">{status}</p>}
    </form>
  );
}
