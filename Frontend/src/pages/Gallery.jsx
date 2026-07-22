import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import Spinner from "../components/Spinner";
import useAuth from "../hooks/useAuth";
import { createGalleryMedia, getGalleryMedia } from "../services/galleryService";
import { absoluteUrl } from "../utils/seoConfig";
import { destinationStories, gallerySeedMedia } from "../utils/staticContent";

const emptySubmission = {
  title: "",
  description: "",
  mediaType: "image",
  url: "",
  thumbnailUrl: "",
  location: "",
  travelDate: "",
  creditName: "",
  creditEmail: ""
};

export default function Gallery() {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [activeTag, setActiveTag] = useState("All");
  const [form, setForm] = useState(emptySubmission);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canPublishDirectly = user?.role === "admin" || user?.role === "moderator";
  const fallbackMedia = destinationStories.map((story) => ({
    _id: story.name,
    title: story.name,
    description: story.hook,
    mediaType: "image",
    url: story.image,
    location: story.name,
    tags: ["Africa", ...(story.tags || []), story.tags?.includes("Zanzibar") ? "Coast" : ""].filter(Boolean),
    tourLink: story.link,
    creditName: "Travellex"
  }));
  const backendMedia = media.map((item) => ({
    ...item,
    tags: inferGalleryTags(item),
    tourLink: `/tours?location=${encodeURIComponent(item.location || "")}`
  }));
  const seededMedia = gallerySeedMedia.map((item) => ({
    ...item,
    tags: ["Africa", ...(item.tags || []), item.tags?.includes("Zanzibar") ? "Coast" : ""].filter(Boolean)
  }));
  const galleryItems = [...seededMedia, ...backendMedia, ...(backendMedia.length ? [] : fallbackMedia)];
  const visibleItems =
    activeTag === "All" ? galleryItems : galleryItems.filter((item) => item.tags?.includes(activeTag));
  const galleryJsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Travellex Africa travel gallery",
    description: "Safari, Zanzibar, Kilimanjaro, coast, wildlife and culture travel scenes curated by Travellex.",
    image: galleryItems.slice(0, 12).map((item) => absoluteUrl(item.url))
  };

  useEffect(() => {
    getGalleryMedia()
      .then((response) => setMedia(response.data.media))
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      await createGalleryMedia(form);
      setStatus(
        canPublishDirectly
          ? "Media published to the gallery."
          : "Experience shared. Travellex will review it before it appears in the gallery."
      );
      setForm(emptySubmission);
      const response = await getGalleryMedia();
      setMedia(response.data.media);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO
        canonicalPath="/gallery"
        description="Browse Africa travel photos and videos from Travellex routes, including Tanzania safari, Zanzibar beaches, Kilimanjaro, Stone Town and wildlife moments."
        jsonLd={galleryJsonLd}
        keywords={["Africa travel gallery", "Tanzania safari photos", "Zanzibar travel photos", "Kilimanjaro travel"]}
        title="Africa Travel Gallery"
      />
      <section className="page-hero compact-hero gallery-hero">
        <p className="eyebrow">Gallery</p>
        <h1>Real travel scenes from safari tracks, mountain air and island light.</h1>
      </section>
      <section className="section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Curated media</p>
            <h2>Approved pictures and videos from Travellex routes.</h2>
          </div>
          <span className="section-badge">{galleryItems.length} moments</span>
        </div>
        <div className="gallery-tabs">
          {["All", "Africa", "Safari", "Coast", "Historical", "Wildlife"].map((tag) => (
            <button className={activeTag === tag ? "active" : ""} key={tag} type="button" onClick={() => setActiveTag(tag)}>
              #{tag}
            </button>
          ))}
        </div>
        {loading ? (
          <Spinner />
        ) : !visibleItems.length ? (
          <p className="empty-state">No approved gallery media matches this tag yet.</p>
        ) : (
          <div className="masonry-gallery">
            {visibleItems.map((item, index) => (
              <article className={index % 5 === 0 ? "media-card tall" : "media-card"} key={item._id}>
                {item.mediaType === "video" ? (
                  <video src={item.url} poster={item.thumbnailUrl} controls preload="metadata" />
                ) : (
                  <img src={item.url} alt={item.title} loading="lazy" />
                )}
                <div className="gallery-overlay">
                  <Link className="button compact" to={item.tourLink || `/tours?location=${encodeURIComponent(item.location || "")}`}>
                    View {item.location || "Destination"} Tours
                  </Link>
                </div>
                <div>
                  <p className="eyebrow">{item.location || "Travel moment"}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span>{item.creditName ? `Shared by ${item.creditName}` : "Travellex curated"}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="section tinted">
        <div className="section-heading">
          <p className="eyebrow">Share your experience</p>
          <h2>Send a picture or video from an Africa journey.</h2>
          <p className="lead">
            Travellers, tour companies and guides can submit media for review. Admins and moderators can publish
            directly; all other submissions wait for approval before appearing publicly.
          </p>
        </div>
        <form className="panel-form wide-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Title</span>
              <input value={form.title} onChange={(event) => update("title", event.target.value)} required />
            </label>
            <label className="field">
              <span>Media type</span>
              <select value={form.mediaType} onChange={(event) => update("mediaType", event.target.value)}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Media URL</span>
            <input value={form.url} onChange={(event) => update("url", event.target.value)} required />
          </label>
          <label className="field">
            <span>Video thumbnail URL</span>
            <input value={form.thumbnailUrl} onChange={(event) => update("thumbnailUrl", event.target.value)} />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Location</span>
              <input value={form.location} onChange={(event) => update("location", event.target.value)} />
            </label>
            <label className="field">
              <span>Travel date or season</span>
              <input value={form.travelDate} onChange={(event) => update("travelDate", event.target.value)} />
            </label>
            <label className="field">
              <span>Your name / credit</span>
              <input value={form.creditName} onChange={(event) => update("creditName", event.target.value)} />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.creditEmail} onChange={(event) => update("creditEmail", event.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Story or context</span>
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Where was this taken, what made the moment special, and who should be credited?"
              rows="5"
            />
          </label>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : canPublishDirectly ? "Publish media" : "Share for review"}
          </button>
          {status && <p className="form-note">{status}</p>}
        </form>
      </section>
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Gallery standards</p>
          <h2>What Travellex approves.</h2>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span>01</span>
            <h3>Clear and relevant</h3>
            <p>Scenes should show real safari, mountain, cultural or coastal experiences connected to Africa travel.</p>
          </article>
          <article className="step-card">
            <span>02</span>
            <h3>Safe to publish</h3>
            <p>Submissions should avoid private documents, unsafe behaviour, offensive material or people shown without permission.</p>
          </article>
          <article className="step-card">
            <span>03</span>
            <h3>Time controlled</h3>
            <p>Admins can schedule media to appear later, switch it off, expire it automatically or remove it from the gallery.</p>
          </article>
        </div>
      </section>
    </>
  );
}

function inferGalleryTags(item) {
  const text = `${item.location || ""} ${item.title || ""} ${item.description || ""}`.toLowerCase();
  const tags = [];

  if (text.includes("zanzibar") || text.includes("paje") || text.includes("nungwi") || text.includes("kendwa") || text.includes("stone")) {
    tags.push("Zanzibar");
    tags.push("Coast");
  }

  if (text.includes("safari") || text.includes("ngorongoro") || text.includes("manyara") || text.includes("mikumi")) {
    tags.push("Safari");
  }

  if (text.includes("fort") || text.includes("cathedral") || text.includes("stone") || text.includes("isimila")) {
    tags.push("Historical");
  }

  if (text.includes("lion") || text.includes("tortoise") || text.includes("forest") || text.includes("monkey") || text.includes("wildlife")) {
    tags.push("Wildlife");
  }

  return tags.length ? ["Africa", ...tags] : ["Africa"];
}
