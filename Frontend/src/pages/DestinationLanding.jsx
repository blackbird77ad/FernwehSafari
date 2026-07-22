import { Link, Navigate, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import { destinationStories } from "../utils/staticContent";
import { getDestinationSeoPage } from "../utils/destinationSeoPages";
import {
  DEFAULT_OG_IMAGE,
  SITE_URL,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildOrganizationSchema,
  canonicalUrl
} from "../utils/seoConfig";

function findStory(page) {
  const text = `${page.primaryLocation} ${page.h1}`.toLowerCase();

  return (
    destinationStories.find((story) => text.includes(story.name.toLowerCase())) ||
    destinationStories.find((story) => story.region && text.includes(story.region.toLowerCase())) ||
    destinationStories[0]
  );
}

export default function DestinationLanding() {
  const { slug } = useParams();
  const page = getDestinationSeoPage(slug);

  if (!page) {
    return <Navigate to="/tours" replace />;
  }

  const story = findStory(page);
  const canonicalPath = `/destinations/${page.slug}`;
  const relatedStories = destinationStories
    .filter((item) => item.name !== story.name)
    .filter((item) => item.region === story.region || item.category === story.category || page.description.includes(item.name))
    .slice(0, 4);
  const jsonLd = [
    buildOrganizationSchema(),
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Destinations", path: "/tours" },
      { name: page.title, path: canonicalPath }
    ]),
    buildFaqSchema(page.faqs),
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      "@id": `${SITE_URL}${canonicalPath}#destination`,
      name: page.title,
      description: page.description,
      url: canonicalUrl(canonicalPath),
      image: DEFAULT_OG_IMAGE,
      touristType: ["Travellers from Germany", "International travellers", "Africa tour planners"],
      includesAttraction: page.highlights.map((highlight) => ({
        "@type": "TouristAttraction",
        name: highlight
      }))
    }
  ];

  return (
    <>
      <SEO
        canonicalPath={canonicalPath}
        description={page.description}
        jsonLd={jsonLd}
        keywords={page.keywords}
        title={`${page.title} | Travellex Africa Travel`}
        type="article"
      />
      <section className="destination-seo-hero" style={{ backgroundImage: `url(${story.image})` }}>
        <div className="destination-seo-overlay" />
        <div className="destination-seo-hero-content">
          <div className="tour-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/tours">Tours</Link>
            <span>/</span>
            <span>{page.title}</span>
          </div>
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>{page.h1}</h1>
          <p>{page.description}</p>
          <div className="button-row">
            <Link className="button primary" to={page.searchLink}>
              Browse matching tours
            </Link>
            <Link className="button secondary light" to="/contact">
              Ask Travellex
            </Link>
          </div>
        </div>
      </section>

      <section className="section destination-seo-layout">
        <article className="destination-seo-main">
          <p className="eyebrow">Travel planning</p>
          <h2>{page.title} with clean comparison before booking.</h2>
          <p className="lead">
            Travellex helps travellers compare real tour listings before they commit. The strongest current route base is
            Tanzania and Zanzibar, with search paths designed for people planning from Germany, Europe and other
            international markets.
          </p>
          <div className="destination-seo-highlights">
            {page.highlights.map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
          <div className="content-block">
            <p>
              Search by destination, activity, comfort level, price, rating and travel date. When a tour feels right,
              continue to the approved operator booking page or ask Travellex a question first.
            </p>
          </div>
        </article>

        <aside className="destination-seo-side">
          <p className="eyebrow">Popular searches</p>
          <h2>Useful routes</h2>
          <Link to="/destinations/germany-to-africa-tours">Africa tours from Germany</Link>
          <Link to="/destinations/tanzania-tours">Tanzania tours</Link>
          <Link to="/destinations/zanzibar-tours">Zanzibar tours</Link>
          <Link to="/destinations/tanzania-safari-tours">Tanzania safari tours</Link>
          <Link to="/destinations/africa-safari-tours">Africa safari tours</Link>
        </aside>
      </section>

      {relatedStories.length > 0 && (
        <section className="section tinted">
          <div className="section-heading split">
            <div>
              <p className="eyebrow">Nearby inspiration</p>
              <h2>Places travellers often compare together.</h2>
            </div>
            <Link className="button secondary" to="/tours">
              View all tours
            </Link>
          </div>
          <div className="destination-story-grid featured-grid">
            {relatedStories.map((item) => (
              <Link className="destination-seo-link-card" to={item.link} key={item.name}>
                <img src={item.image} alt={`${item.name} travel scene`} loading="lazy" />
                <span>{item.region}</span>
                <strong>{item.name}</strong>
                <p>{item.hook}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Questions</p>
          <h2>Helpful answers before you choose.</h2>
        </div>
        <div className="faq-grid">
          {page.faqs.map(([question, answer]) => (
            <article className="step-card" key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
        <div className="destination-seo-cta">
          <Link className="button primary" to={page.searchLink}>
            Search tours
          </Link>
          <a className="button secondary" href={`mailto:experience@travellex.tours?subject=${encodeURIComponent(page.title)}`}>
            Email Travellex
          </a>
        </div>
      </section>
    </>
  );
}
