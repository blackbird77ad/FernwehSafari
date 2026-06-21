import { Link } from "react-router-dom";

export default function DestinationStoryCard({ story, featured = false }) {
  return (
    <article className={featured ? "destination-story-card featured" : "destination-story-card"}>
      <Link className="destination-story-image" to={story.link}>
        <img src={story.image} alt={story.name} loading="lazy" />
      </Link>
      <div className="destination-story-body">
        <div className="place-meta">
          <span>{story.region}</span>
          <span>{story.category}</span>
        </div>
        <div>
          <p className="eyebrow">{story.name}</p>
          <h3>{story.hook}</h3>
          <p>{story.description}</p>
        </div>
        <div className="story-card-actions">
          <p>{story.cta}</p>
          <Link className="button compact" to={story.link}>
            {story.buttonLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
