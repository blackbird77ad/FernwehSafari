import { destinationStories } from "../utils/staticContent";

const trustAnchors = [
  ["Verified Local Operators", "Companies are reviewed before routes appear publicly."],
  ["Secure Referral Architecture", "Travellers move from discovery to the original booking flow with clear handoff."],
  ["On-the-Ground Experts", "Destination context is shaped around real Tanzania and Zanzibar travel patterns."]
];

export default function About() {
  const profileImage = destinationStories.find((story) => story.name === "Stone Town")?.image || destinationStories[0].image;

  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">About FernwehSafari</p>
        <h1>Trust infrastructure for Tanzania and Zanzibar tour discovery.</h1>
      </section>
      <section className="section about-trust-layout">
        <div className="profile-orbit">
          <img src={profileImage} alt="Stone Town travel scene" />
        </div>
        <div>
          <p className="eyebrow">Mission</p>
          <h2>A clearer bridge between European travellers and local routes.</h2>
          <p className="lead">
            FernwehSafari helps travellers compare Tanzania safaris, Kilimanjaro routes, heritage walks and Zanzibar
            coast experiences before they book. We keep the site visual and emotional, but every journey still needs
            practical details, reviewed partners and a clean referral path. Good local operators deserve a better way
            to be found without making travellers feel lost in too many tabs.
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
