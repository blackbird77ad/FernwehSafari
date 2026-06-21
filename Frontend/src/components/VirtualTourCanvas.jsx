import { createElement, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function VirtualTourCanvas({ scene }) {
  const [modules, setModules] = useState(null);
  const [error, setError] = useState("");
  const [tiltEnabled, setTiltEnabled] = useState(false);

  useEffect(() => {
    let alive = true;
    const fiberPackage = "@react-three/fiber";
    const dreiPackage = "@react-three/drei";
    const threePackage = "three";

    Promise.all([
      import(/* @vite-ignore */ fiberPackage),
      import(/* @vite-ignore */ dreiPackage),
      import(/* @vite-ignore */ threePackage)
    ])
      .then(([fiber, drei, three]) => {
        if (alive) {
          setModules({ fiber, drei, three });
        }
      })
      .catch(() => {
        if (alive) {
          setError("The 360 viewer dependencies are not installed yet. Install @react-three/fiber, @react-three/drei and three.");
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  async function enableTilt() {
    const orientation = window.DeviceOrientationEvent;

    if (orientation?.requestPermission) {
      const permission = await orientation.requestPermission();
      setTiltEnabled(permission === "granted");
      return;
    }

    setTiltEnabled(true);
  }

  if (error) {
    return (
      <div className="virtual-fallback">
        <p>{error}</p>
        <Link className="button primary" to={scene.bookingLink}>
          Love this view? Book the real tour here.
        </Link>
      </div>
    );
  }

  if (!modules) {
    return <div className="virtual-fallback">Preparing the 360 viewer...</div>;
  }

  const Canvas = modules.fiber.Canvas;

  return (
    <div className="virtual-canvas-wrap">
      <Canvas camera={{ position: [0, 0, 0], fov: 75 }}>
        <PanoramaScene image={scene.image} modules={modules} tiltEnabled={tiltEnabled} />
      </Canvas>
      <div className="virtual-overlay">
        <button className="button secondary light" type="button" onClick={enableTilt}>
          📱 {tiltEnabled ? "Tilt-to-view on" : "Turn on Tilt-to-View"}
        </button>
        <Link className="button primary" to={scene.bookingLink}>
          Love this view? Book the real tour here.
        </Link>
      </div>
    </div>
  );
}

function PanoramaScene({ image, modules, tiltEnabled }) {
  const { OrbitControls } = modules.drei;
  const { useFrame, useLoader } = modules.fiber;
  const THREE = modules.three;
  const texture = useLoader(THREE.TextureLoader, image);
  const orientation = useDeviceOrientation(tiltEnabled);

  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame(({ camera }) => {
    if (!tiltEnabled || orientation.beta == null || orientation.gamma == null) {
      return;
    }

    camera.rotation.x = THREE.MathUtils.degToRad((orientation.beta - 90) * 0.35);
    camera.rotation.y = THREE.MathUtils.degToRad(orientation.gamma * 0.35);
  });

  return createElement(
    "group",
    null,
    createElement(
      "mesh",
      { scale: [-1, 1, 1] },
      createElement("sphereGeometry", { args: [500, 60, 40] }),
      createElement("meshBasicMaterial", { map: texture, side: THREE.BackSide })
    ),
    createElement(OrbitControls, { enablePan: false, enableZoom: false, rotateSpeed: 0.45 })
  );
}

function useDeviceOrientation(enabled) {
  const [orientation, setOrientation] = useState({});

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function handleOrientation(event) {
      setOrientation({ alpha: event.alpha, beta: event.beta, gamma: event.gamma });
    }

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [enabled]);

  return useMemo(() => orientation, [orientation]);
}
