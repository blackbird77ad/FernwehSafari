import { useEffect, useState } from "react";
import { isVideoMedia } from "../utils/tourMedia";

export default function ImageGallery({ altBase = "Tour", images = [] }) {
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (!activeImage) {
      return undefined;
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setActiveImage(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeImage]);

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="image-gallery" aria-label={`${altBase} media gallery`}>
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveImage(image)}
            aria-label={`Open ${altBase} media ${index + 1}`}
          >
            {isVideoMedia(image) ? (
              <video src={image} muted preload="metadata" aria-label={`${altBase} video ${index + 1}`} />
            ) : (
              <img src={image} alt={`${altBase} gallery image ${index + 1}`} loading="lazy" />
            )}
          </button>
        ))}
      </div>
      {activeImage && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${altBase} expanded media`} onClick={() => setActiveImage(null)}>
          <button type="button" onClick={() => setActiveImage(null)} aria-label="Close expanded media">
            Close
          </button>
          {isVideoMedia(activeImage) ? (
            <video src={activeImage} controls autoPlay />
          ) : (
            <img src={activeImage} alt={`${altBase} expanded gallery media`} />
          )}
        </div>
      )}
    </>
  );
}
