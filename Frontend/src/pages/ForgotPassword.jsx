import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email) {
      setTone("error");
      setMessage("Enter your email so we can send a reset link.");
      return;
    }

    setSubmitting(true);
    setTone("");

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.data.message);
      setTone("");
    } catch (error) {
      setTone("error");
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page verify-email-page">
      <div className="auth-card verify-email-card">
        <p className="eyebrow">Password reset</p>
        <h1>Reset your Travellex password.</h1>
        {message && <p className={tone === "error" ? "form-note error" : "form-note"}>{message}</p>}
        <form className="panel-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <p>
          Remembered it? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}
