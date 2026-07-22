import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import SEO from "../components/SEO";
import loginImage from "../assets/photos/kendwa-beach-tourist.png";
import useAuth from "../hooks/useAuth";
import { clearPendingBookingPath, getPathFromLocationState, getPendingBookingPath } from "../utils/bookingIntent";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message || "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const loggedInUser = await login(form);
      const isStaff = loggedInUser?.role === "admin" || loggedInUser?.role === "moderator";
      const requestedPath = getPathFromLocationState(location.state?.from) || getPendingBookingPath();

      if (requestedPath) {
        clearPendingBookingPath();
      }

      navigate(isStaff ? "/admin" : requestedPath || "/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <SEO canonicalPath="/login" noindex title="Travellex Login" />
      <div className="auth-split">
        <div className="login-image-card">
          <img src={loginImage} alt="Traveller enjoying Zanzibar beach" />
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Return to your saved routes and partner tools.</h2>
          </div>
        </div>
        <form className="auth-card login-panel" onSubmit={handleSubmit}>
          <p className="eyebrow">Login</p>
          <h1>Access your dashboard.</h1>
          {notice && <p className="form-note">{notice}</p>}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <PasswordInput
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>
          {error && <p className="form-note error">{error}</p>}
          {error.toLowerCase().includes("verify") && (
            <p>
              Need a new link? <Link to="/verify-email" state={{ email: form.email, from: location.state?.from }}>Resend confirmation</Link>
            </p>
          )}
          <p>
            <Link to="/forgot-password" state={{ email: form.email }}>
              Forgot password?
            </Link>
          </p>
          <p>
            No account yet? <Link to="/register" state={{ from: location.state?.from }}>Register</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
