import { Link } from "react-router-dom";
import { destinationStories } from "../utils/staticContent";

const heroSlides = [
  destinationStories.find((story) => story.name === "Lake Manyara National Park"),
  destinationStories.find((story) => story.name === "Mount Kilimanjaro"),
  destinationStories.find((story) => story.name === "Paje Beach")
].filter(Boolean);

export default function HeroSection() {
  return (
    <section className="fast-hero relative h-[40svh] min-h-[18rem] max-h-[40svh] overflow-hidden bg-fernweh-deep text-white md:h-[58vh] md:max-h-[34rem]">
      <div className="hero-carousel flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth">
        {heroSlides.map((slide) => (
          <div className="relative h-full min-w-full snap-center" key={slide.name}>
            <img className="h-full w-full object-cover" src={slide.image} alt={slide.name} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 grid content-end p-5 md:p-12">
        <div className="max-w-3xl">
          <p className="eyebrow">Tanzania & Zanzibar tours</p>
          <h1 className="text-4xl font-black leading-none md:text-7xl">Explore Tanzania & Zanzibar.</h1>
          <p className="mt-3 max-w-xl text-base text-white/85 md:text-xl">
            Safari plains, Kilimanjaro air, spice-island streets and warm Indian Ocean water in one quick gateway.
          </p>
          <div className="pointer-events-auto mt-5 flex flex-wrap gap-3">
            <Link className="button primary" to="/tours">
              Browse tours
            </Link>
            <Link className="button secondary light" to="/virtual-tour">
              Preview in 360
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
