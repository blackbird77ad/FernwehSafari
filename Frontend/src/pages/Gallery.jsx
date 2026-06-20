import ImageGallery from "../components/ImageGallery";
import { galleryImages } from "../utils/staticContent";

export default function Gallery() {
  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">Gallery</p>
        <h1>Safari parks, mountain views, beaches, forests and heritage stops.</h1>
      </section>
      <section className="section">
        <ImageGallery images={galleryImages} />
      </section>
    </>
  );
}
