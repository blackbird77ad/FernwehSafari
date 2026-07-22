import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import SEO from "../components/SEO";
import registerImage from "../assets/photos/Nungwi beach Zanzibar-homepage.jpg";
import useAuth from "../hooks/useAuth";
import { getPathFromLocationState, getPendingBookingPath } from "../utils/bookingIntent";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", country: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await register(form);
      navigate("/verify-email", {
        replace: true,
        state: {
          email: response.email || form.email,
          from: getPathFromLocationState(location.state?.from) || getPendingBookingPath(),
          message: response.verificationEmailMessage,
          sent: response.verificationEmailSent
        }
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <SEO canonicalPath="/register" noindex title="Create Travellex Account" />
      <div className="auth-split register-split">
        <div className="login-image-card register-image-card">
          <img src={registerImage} alt="Nungwi beach in Zanzibar at golden hour" />
          <div>
            <p className="eyebrow">Plan with confidence</p>
            <h2>Save Africa tours and adventures before you book.</h2>
            <div className="auth-trust-list">
              <span>Verified local operators</span>
              <span>Easy operator booking</span>
              <span>Partner tools after approval</span>
            </div>
          </div>
        </div>
        <form className="auth-card login-panel register-panel" onSubmit={handleSubmit}>
          <p className="eyebrow">Traveller registration</p>
          <h1>Create your Travellex account.</h1>
          <p className="form-note">
            Traveller accounts can save tours and request guides. Tour companies should apply through{" "}
            <Link to="/partner">Partner</Link>.
          </p>
          <div className="form-grid register-form-grid">
            <label className="field">
              <span>Name</span>
              <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
            </label>
            <label className="field">
              <span>Country</span>
              <input value={form.country} onChange={(event) => update("country", event.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <PasswordInput
              autoComplete="new-password"
              minLength="8"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
            />
          </label>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create traveller account"}
          </button>
          {error && <p className="form-note error">{error}</p>}
          <p>
            Already have an account? <Link to="/login" state={{ from: location.state?.from }}>Login</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
