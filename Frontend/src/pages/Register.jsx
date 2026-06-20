import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
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
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Register</p>
        <h1>Create a FernwehSafari traveller account.</h1>
        <label className="field">
          <span>Name</span>
          <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            minLength="8"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Country</span>
          <input value={form.country} onChange={(event) => update("country", event.target.value)} />
        </label>
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
        {error && <p className="form-note error">{error}</p>}
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
