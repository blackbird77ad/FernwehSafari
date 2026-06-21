import { Suspense, lazy, useState } from "react";
import mnembaPanorama from "../assets/photos/Mnemba island tour-hero-page-bg.jpg";
import ngorongoroPanorama from "../assets/photos/Ngorongoro-National-Park-Tanzania-crater.webp";
import Spinner from "../components/Spinner";

const VirtualTourCanvas = lazy(() => import("../components/VirtualTourCanvas"));

const scenes = [
  {
    name: "Mnemba Island Atoll",
    image: mnembaPanorama,
    bookingLink: "/tours?location=Mnemba"
  },
  {
    name: "Ngorongoro Crater",
    image: ngorongoroPanorama,
    bookingLink: "/tours?location=Ngorongoro"
  }
];

export default function VirtualTour() {
  const [scene, setScene] = useState(scenes[0]);

  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">Virtual tour</p>
        <h1>Preview the feeling, then book the real journey.</h1>
      </section>
      <section className="virtual-tour-shell">
        <div className="scene-picker">
          {scenes.map((item) => (
            <button className={item.name === scene.name ? "active" : ""} key={item.name} type="button" onClick={() => setScene(item)}>
              {item.name}
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
