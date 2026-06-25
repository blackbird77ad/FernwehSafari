import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import loginImage from "../assets/photos/kendwa-beach-tourist.png";
import useAuth from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const loggedInUser = await login(form);
      const isStaff = loggedInUser?.role === "admin" || loggedInUser?.role === "moderator";
      const requestedPath = getRedirectPath(location.state?.from);

      navigate(isStaff ? "/admin" : requestedPath || "/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
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
          <p>
            No account yet? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

function getRedirectPath(from) {
  if (!from) {
    return "";
  }

  if (typeof from === "string") {
    return from;
  }

  return `${from.pathname || ""}${from.search || ""}${from.hash || ""}` || "";
}
