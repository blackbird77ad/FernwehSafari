import { Suspense, lazy, useState } from "react";
import stoneTownPanorama from "../assets/photos/Aerial-View-Stone-Town-Zanzibar.jpg";
import jozaniPanorama from "../assets/photos/Jozani forest Zanzibar-footbridge.jpg";
import kilimanjaroPanorama from "../assets/photos/Mountain-kilimanjaro-Tanzania1.jpg";
import manyaraPanorama from "../assets/photos/manyara-national-park-lion.jpg";
import mnembaPanorama from "../assets/photos/Mnemba island tour-hero-page-bg.jpg";
import ngorongoroPanorama from "../assets/photos/Ngorongoro-National-Park-Tanzania-crater.webp";
import oldFortPanorama from "../assets/photos/Old fort Zanzibar.webp";
import pajePanorama from "../assets/photos/Paje_Zanzibar-kiting.webp";
import prisonIslandPanorama from "../assets/photos/prison-island-from-above.webp";
import SEO from "../components/SEO";
import Spinner from "../components/Spinner";

const VirtualTourCanvas = lazy(() => import("../components/VirtualTourCanvas"));

const scenes = [
  {
    name: "Mnemba Island Atoll",
    location: "Zanzibar coast",
    mood: "Low glide over reef water and island tree cover.",
    image: mnembaPanorama,
    bookingLink: "/tours?location=Mnemba"
  },
  {
    name: "Ngorongoro Crater",
    location: "Northern Tanzania",
    mood: "Wide crater sweep with slow safari lookout motion.",
    image: ngorongoroPanorama,
    bookingLink: "/tours?location=Ngorongoro"
  },
  {
    name: "Lake Manyara",
    location: "Rift Valley",
    mood: "Wildlife-level view with a gentle field-guide drift.",
    image: manyaraPanorama,
    bookingLink: "/tours?location=Manyara"
  },
  {
    name: "Kilimanjaro View",
    location: "Tanzania highlands",
    mood: "Crisp mountain air and a slow horizon scan.",
    image: kilimanjaroPanorama,
    bookingLink: "/tours?location=Kilimanjaro"
  },
  {
    name: "Stone Town",
    location: "Zanzibar City",
    mood: "Aerial city texture with warm coastal movement.",
    image: stoneTownPanorama,
    bookingLink: "/tours?location=Stone%20Town"
  },
  {
    name: "Jozani Forest",
    location: "Zanzibar forest",
    mood: "Shaded boardwalk feeling with soft eye-level drift.",
    image: jozaniPanorama,
    bookingLink: "/tours?location=Jozani"
  },
  {
    name: "Paje Kite Beach",
    location: "East Zanzibar",
    mood: "Wind, water and beach motion with a bright coastal lens.",
    image: pajePanorama,
    bookingLink: "/tours?location=Paje"
  },
  {
    name: "Old Fort",
    location: "Stone Town heritage",
    mood: "Historic walls and courtyard perspective with slow turning.",
    image: oldFortPanorama,
    bookingLink: "/tours?location=Old%20Fort"
  },
  {
    name: "Prison Island",
    location: "Zanzibar archipelago",
    mood: "Island approach feel with a floating boat-like motion.",
    image: prisonIslandPanorama,
    bookingLink: "/tours?location=Prison%20Island"
  }
];

export default function VirtualTour() {
  const [scene, setScene] = useState(scenes[0]);

  return (
    <>
      <SEO
        canonicalPath="/virtual-tour"
        description="Preview Tanzania, Zanzibar, Kilimanjaro, Ngorongoro, Stone Town and island travel scenes before choosing an Africa tour on Travellex."
        keywords={["Africa virtual tour", "Zanzibar virtual tour", "Tanzania safari preview", "Kilimanjaro travel preview"]}
        title="Africa Virtual Tour Preview"
      />
      <section className="page-hero compact-hero virtual-tour-hero">
        <p className="eyebrow">Virtual tour</p>
        <h1>Preview the feeling, then book the real journey.</h1>
      </section>
      <section className="virtual-tour-shell">
        <div className="scene-picker">
          {scenes.map((item) => (
            <button className={item.name === scene.name ? "active" : ""} key={item.name} type="button" onClick={() => setScene(item)}>
              <strong>{item.name}</strong>
              <span>{item.location}</span>
            </button>
          ))}
        </div>
        <Suspense fallback={<Spinner label="Loading 360 viewport" />}>
          <VirtualTourCanvas scene={scene} />
        </Suspense>
      </section>
    </>
  );
}
