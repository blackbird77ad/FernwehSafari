import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="page-hero compact-hero">
      <p className="eyebrow">404</p>
      <h1>This page is not part of the route.</h1>
      <Link className="button primary" to="/">
        Back home
      </Link>
    </section>
  );
}
