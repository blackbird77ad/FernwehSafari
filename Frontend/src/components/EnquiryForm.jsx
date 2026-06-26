import { useState } from "react";
import { createEnquiry } from "../services/enquiryService";
import useAuth from "../hooks/useAuth";

export default function EnquiryForm({ requestType = "question", tour }) {
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    travelDate: "",
    groupSize: "",
    budgetEUR: "",
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
        tour: tour?._id,
        requestType
      });
      setStatus(requestType === "quote" ? "Quote request sent. Travellex will follow up with availability and booking options." : "Enquiry sent. Travellex will follow up with next steps.");
      setForm({
        name: isAuthenticated ? user?.name || "" : "",
        email: isAuthenticated ? user?.email || "" : "",
        travelDate: "",
        groupSize: "",
        budgetEUR: "",
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
      <div className="form-grid">
        <label className="field">
          <span>Travel date</span>
          <input type="date" value={form.travelDate} onChange={(event) => update("travelDate", event.target.value)} />
        </label>
        <label className="field">
          <span>Group size</span>
          <input type="number" min="1" value={form.groupSize} onChange={(event) => update("groupSize", event.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Budget EUR</span>
        <input type="number" min="0" step="100" value={form.budgetEUR} onChange={(event) => update("budgetEUR", event.target.value)} />
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
          placeholder={requestType === "quote" ? "Ask about availability, room level, private/shared options, pickup city or payment terms." : "Tell us your travel dates, group size and questions."}
          rows="5"
        />
      </label>
      <button className="button primary" type="submit" disabled={submitting}>
        {submitting ? "Sending..." : requestType === "quote" ? "Request quote" : "Submit enquiry"}
      </button>
      {status && <p className="form-note">{status}</p>}
    </form>
  );
}
