import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { resendVerification } from "../services/authService";

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const location = useLocation();
  const token = useMemo(() => new URLSearchParams(location.search).get("token"), [location.search]);
  const [email, setEmail] = useState(location.state?.email || "");
  const [message, setMessage] = useState(
    token ? "Confirming your email..." : location.state?.message || "Check your inbox for the Travellex confirmation link."
  );
  const [tone, setTone] = useState(token ? "" : location.state?.sent === false ? "error" : "");
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let alive = true;

    verifyEmail(token)
      .then(() => {
        if (alive) {
          setVerified(true);
          setTone("");
          setMessage("Email confirmed. Your Travellex account is ready.");
        }
      })
      .catch((error) => {
        if (alive) {
          setTone("error");
          setMessage(error.message);
        }
      });

    return () => {
      alive = false;
    };
  }, [token, verifyEmail]);

  async function handleResend(event) {
    event.preventDefault();

    if (!email) {
      setTone("error");
      setMessage("Enter your email so we can send a new confirmation link.");
      return;
    }

    setSubmitting(true);
    setTone("");

    try {
      const response = await resendVerification(email);
      setMessage(response.data.verificationEmailMessage || response.data.message || "If this email needs verification, a new link will be sent.");
      setTone(response.data.verificationEmailSent === false ? "error" : "");
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
        <p className="eyebrow">Email confirmation</p>
        <h1>{verified ? "You are verified." : "Confirm your Travellex email."}</h1>
        <p className={tone === "error" ? "form-note error" : "form-note"}>{message}</p>
        {verified ? (
          <Link className="button primary" to="/dashboard">
            Continue to dashboard
          </Link>
        ) : (
          <form className="panel-form" onSubmit={handleResend}>
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <button className="button primary" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send confirmation link"}
            </button>
          </form>
        )}
        <p>
          Already confirmed? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}
