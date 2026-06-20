import { useState } from "react";

export default function ImageGallery({ images = [] }) {
  const [activeImage, setActiveImage] = useState(null);

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="image-gallery">
        {images.map((image) => (
          <button key={image} type="button" onClick={() => setActiveImage(image)}>
            <img src={image} alt="Tour gallery" loading="lazy" />
          </button>
        ))}
      </div>
      {activeImage && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setActiveImage(null)}>
          <button type="button" onClick={() => setActiveImage(null)}>
            Close
          </button>
          <img src={activeImage} alt="Expanded gallery" />
        </div>
      )}
    </>
  );
}
