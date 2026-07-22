import { destinationStories } from "../utils/staticContent";
import SEO from "../components/SEO";
import { buildOrganizationSchema } from "../utils/seoConfig";

const trustAnchors = [
  ["Verified Local Operators", "Companies are reviewed before routes appear publicly."],
  ["Simple Booking Path", "Travellers can compare routes, choose a tour and continue with the right operator."],
  ["On-the-Ground Experts", "Destination context is shaped around real Africa travel patterns, starting with Tanzania and Zanzibar."]
];

export default function About() {
  const profileImage = destinationStories.find((story) => story.name === "Stone Town")?.image || destinationStories[0].image;

  return (
    <>
      <SEO
        canonicalPath="/about"
        description="Travellex is an Africa-focused travel marketplace helping travellers from Germany and Europe compare Tanzania, Zanzibar and wider Africa tours from approved operators."
        jsonLd={buildOrganizationSchema()}
        keywords={["About Travellex", "Africa tour marketplace", "Germany to Africa travel", "Tanzania and Zanzibar travel"]}
        title="About Travellex Africa Tours"
      />
      <section className="page-hero compact-hero about-hero">
        <p className="eyebrow">About Travellex</p>
        <h1>A clearer way to find Africa tours.</h1>
      </section>
      <section className="section about-trust-layout">
        <div className="profile-orbit">
          <img src={profileImage} alt="Stone Town travel scene" />
        </div>
        <div>
          <p className="eyebrow">Mission</p>
          <h2>A clearer bridge between travellers and local adventure routes.</h2>
          <p className="lead">
            Travellex helps travellers compare Africa tours and adventure experiences before they book. Tanzania
            safaris, Kilimanjaro routes, heritage walks and Zanzibar coast escapes are the current strongest focus,
            but the platform is built for a wider travel map. We keep the site visual and emotional, while every
            journey still gets practical details, reviewed partners and a clean route to booking.
          </p>
        </div>
      </section>
      <section className="section tinted">
        <div className="trust-anchor-row">
          {trustAnchors.map(([title, text], index) => (
            <article key={title}>
              <TrustIcon index={index} />
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function TrustIcon({ index }) {
  const paths = [
    "M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7l7-4z",
    "M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z",
    "M4 17l5-5 4 4 7-8M4 21h16"
  ];

  return (
    <svg aria-hidden="true" className="trust-icon" fill="none" viewBox="0 0 24 24">
      <path d={paths[index]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}
