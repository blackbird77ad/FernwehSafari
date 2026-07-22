import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function NotFound() {
  return (
    <section className="page-hero compact-hero not-found-hero">
      <SEO canonicalPath="/404" noindex title="Page Not Found" />
      <p className="eyebrow">404</p>
      <h1>This page is not part of the route.</h1>
      <Link className="button primary" to="/">
        Back home
      </Link>
    </section>
  );
}
