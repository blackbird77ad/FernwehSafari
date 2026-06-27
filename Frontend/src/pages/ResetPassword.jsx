import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import { resetPassword } from "../services/authService";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get("token"), [location.search]);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(token ? "" : "Password reset token is missing.");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setMessage("Password reset token is missing.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await resetPassword({ token, password });
      navigate("/login", {
        replace: true,
        state: {
          message: response.data.message
        }
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page verify-email-page">
      <div className="auth-card verify-email-card">
        <p className="eyebrow">New password</p>
        <h1>Choose a new password.</h1>
        {message && <p className="form-note error">{message}</p>}
        <form className="panel-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Password</span>
            <PasswordInput
              autoComplete="new-password"
              minLength="8"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="button primary" type="submit" disabled={submitting || !token}>
            {submitting ? "Updating..." : "Update password"}
          </button>
        </form>
        <p>
          Need a new link? <Link to="/forgot-password">Request reset</Link>
        </p>
      </div>
    </section>
  );
}
