import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";

export default function VirtualTourCanvas({ scene }) {
  const frameRef = useRef(null);
  const pointerLookRef = useRef({ x: 0, y: 0 });
  const mediaSrc = scene.mediaUrl || scene.image;
  const isVideo = scene.mediaType === "video";
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [immersive, setImmersive] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [lookStatus, setLookStatus] = useState("");

  useEffect(() => {
    function syncFullscreenState() {
      setImmersive(document.fullscreenElement === frameRef.current);
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  async function toggleLookMode() {
    if (tiltEnabled) {
      setTiltEnabled(false);
      setLookStatus("");
      pointerLookRef.current = { x: 0, y: 0 };
      return;
    }

    const orientation = window.DeviceOrientationEvent;
    let hasGyro = Boolean(orientation);

    try {
      if (orientation?.requestPermission) {
        const permission = await orientation.requestPermission();
        hasGyro = permission === "granted";
      }
    } catch {
      hasGyro = false;
    }

    setTiltEnabled(true);
    setLookStatus(hasGyro ? "Move your phone or pointer to look around." : "Move your pointer over the scene to look around.");
  }

  async function toggleImmersiveMode() {
    if (!frameRef.current || !frameRef.current.requestFullscreen) {
      setImmersive((value) => !value);
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await frameRef.current.requestFullscreen();
  }

  function handlePointerMove(event) {
    if (!tiltEnabled || !frameRef.current) {
      return;
    }

    const bounds = frameRef.current.getBoundingClientRect();
    pointerLookRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    };
  }

  function handlePointerLeave() {
    pointerLookRef.current = { x: 0, y: 0 };
  }

  return (
    <div
      className={`${immersive ? "virtual-canvas-wrap is-immersive" : "virtual-canvas-wrap"}${tiltEnabled ? " is-look-enabled" : ""}`}
      ref={frameRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }} dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <color attach="background" args={["#070d16"]} />
        <PanoramaScene
          key={`${scene.name}-${mediaSrc}`}
          scene={scene}
          motionEnabled={motionEnabled}
          pointerLookRef={pointerLookRef}
          tiltEnabled={tiltEnabled}
        />
      </Canvas>
      <div className="virtual-lens" aria-hidden="true" />
      <div className="virtual-reticle" aria-hidden="true" />
      <div className="virtual-scene-panel">
        <span>{scene.location}</span>
        <strong>{scene.name}</strong>
        <small>{scene.mood}</small>
      </div>
      <div className="virtual-live-indicator" aria-hidden="true">
        <span />
        {isVideo ? "Live video" : "Live drift"}
      </div>
      <div className="virtual-overlay">
        <div className="virtual-control-cluster" aria-label="Virtual tour controls">
          <button className="vr-control-button" type="button" onClick={() => setMotionEnabled((value) => !value)} aria-pressed={motionEnabled}>
            {motionEnabled ? <PauseIcon /> : <PlayIcon />}
            <span>{motionEnabled ? "Motion on" : "Motion off"}</span>
          </button>
          <button className="vr-control-button" type="button" onClick={toggleLookMode} aria-pressed={tiltEnabled}>
            <PhoneIcon />
            <span>{tiltEnabled ? "Look on" : "Look mode"}</span>
          </button>
          <button className="vr-control-button" type="button" onClick={toggleImmersiveMode} aria-pressed={immersive}>
            {immersive ? <MinimizeIcon /> : <MaximizeIcon />}
            <span>{immersive ? "Exit VR" : "VR view"}</span>
          </button>
        </div>
        {tiltEnabled && <p className="virtual-look-note">{lookStatus}</p>}
        {scene.bookingLink && (
          <Link className="button primary" to={scene.bookingLink}>
            {scene.bookingLabel || "Love this view? Book the real tour here."}
          </Link>
        )}
      </div>
    </div>
  );
}

function PanoramaScene({ scene, motionEnabled, pointerLookRef, tiltEnabled }) {
  const src = scene.mediaUrl || scene.image;

  if (scene.mediaType === "video") {
    return <VideoPanoramaScene motionEnabled={motionEnabled} pointerLookRef={pointerLookRef} src={src} tiltEnabled={tiltEnabled} />;
  }

  return <ImagePanoramaScene motionEnabled={motionEnabled} pointerLookRef={pointerLookRef} src={src} tiltEnabled={tiltEnabled} />;
}

function ImagePanoramaScene({ src, motionEnabled, pointerLookRef, tiltEnabled }) {
  const texture = useLoader(THREE.TextureLoader, src);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return <PanoramaRig motionEnabled={motionEnabled} pointerLookRef={pointerLookRef} texture={texture} tiltEnabled={tiltEnabled} />;
}

function VideoPanoramaScene({ src, motionEnabled, pointerLookRef, tiltEnabled }) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!src) {
      return undefined;
    }

    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = "auto";

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    setTexture(videoTexture);
    void video.play();

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoTexture.dispose();
    };
  }, [src]);

  if (!texture) {
    return null;
  }

  return <PanoramaRig motionEnabled={motionEnabled} pointerLookRef={pointerLookRef} texture={texture} tiltEnabled={tiltEnabled} />;
}

function PanoramaRig({ texture, motionEnabled, pointerLookRef, tiltEnabled }) {
  const sphereRef = useRef(null);
  const orientation = useDeviceOrientation(tiltEnabled);

  useFrame(({ camera, clock }, delta) => {
    const elapsed = clock.getElapsedTime();

    if (motionEnabled && sphereRef.current) {
      sphereRef.current.rotation.y += delta * 0.018;
      sphereRef.current.rotation.x = Math.sin(elapsed * 0.22) * 0.006;
      sphereRef.current.rotation.z = Math.sin(elapsed * 0.15) * 0.004;
    }

    if (motionEnabled) {
      const naturalFov = 75 + Math.sin(elapsed * 0.4) * 0.42;
      camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, Math.sin(elapsed * 0.72) * 0.0028, 0.04);

      if (Math.abs(camera.fov - naturalFov) > 0.01) {
        camera.fov = naturalFov;
        camera.updateProjectionMatrix();
      }
    } else if (Math.abs(camera.fov - 75) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, 75, 0.08);
      camera.updateProjectionMatrix();
    }

    if (tiltEnabled && orientation.beta != null && orientation.gamma != null) {
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, THREE.MathUtils.degToRad((orientation.beta - 90) * 0.35), 0.12);
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, THREE.MathUtils.degToRad(orientation.gamma * 0.35), 0.12);
    } else if (tiltEnabled) {
      const pointerLook = pointerLookRef.current;
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, THREE.MathUtils.degToRad(pointerLook.y * 13), 0.1);
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, THREE.MathUtils.degToRad(pointerLook.x * -24), 0.1);
    }
  });

  return (
    <group ref={sphereRef}>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[500, 96, 64]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>
      <OrbitControls enabled={!tiltEnabled} enableDamping dampingFactor={0.055} enablePan={false} enableZoom={false} rotateSpeed={0.36} />
    </group>
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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m8 5 11 7-11 7Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="12" height="20" x="6" y="2" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
