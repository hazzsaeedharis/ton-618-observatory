import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Download,
  Focus,
  Maximize2,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { BlackHoleViewer } from "./viewer";
import { scaleMetrics } from "./science.mjs";

type Mode = "observe" | "anatomy" | "scale";
type Layer = "disk" | "shadow" | "lensing" | "beaming";
const journeySteps = [
  {
    title: "Meet the darkness.",
    eyebrow: "THE BLACK HOLE & ITS LIGHT",
    body: "The glow comes from gas outside the black hole. The dark silhouette is its shadow, enlarged by gravity. Take a moment to look around.",
    pose: [0, 7, 27],
  },
  {
    title: "Follow the light.",
    eyebrow: "A DIFFERENT PATH THROUGH SPACE",
    body: "The arch is a view of the far side of the same disk. Gravity bends its light toward you. Compare the two views to see what changes.",
    pose: [0, 5.4, 25],
  },
  {
    title: "A new perspective.",
    eyebrow: "ABOVE THE ACCRETION DISK",
    body: "From above, the sweeping arcs resolve into a disk around the darkness. It is the same scene, seen from a different angle. Drag to explore your own viewpoint.",
    pose: [0, 26, 3.5],
  },
  {
    title: "Find our place in it.",
    eyebrow: "AN EXTRAORDINARY SENSE OF SCALE",
    body: "That tiny blue circle is Neptune’s orbit. About 43 of its diameters fit across this event horizon, using the 66-billion-Sun estimate and a nonrotating model.",
    pose: [0, 7, 27],
  },
];
const chapters: {
  id: Layer;
  number: string;
  name: string;
  subtitle: string;
  body: string;
}[] = [
  {
    id: "disk",
    number: "01",
    name: "Accretion disk",
    subtitle: "The light belongs to the matter.",
    body: "Gas orbiting outside the event horizon becomes hot and luminous. The glowing disk is what we see; the black hole itself emits no light. Here, flowing bands and warm colors are an artistic interpretation.",
  },
  {
    id: "shadow",
    number: "02",
    name: "The shadow",
    subtitle: "An absence larger than its source.",
    body: "The dark silhouette is enlarged by gravity. In the nonrotating model used here, its apparent radius is about 2.6 times the event horizon’s radius. The fine blue outline is a teaching guide, not a physical surface.",
  },
  {
    id: "lensing",
    number: "03",
    name: "Bent light",
    subtitle: "The far side comes into view.",
    body: "Light follows curved paths through spacetime. The arcs above and below the shadow are distorted views of the same disk. Switch lensing off to compare with straight light paths.",
  },
  {
    id: "beaming",
    number: "04",
    name: "Doppler beaming",
    subtitle: "One disk. Two different intensities.",
    body: "Gas moving toward us appears brighter; receding gas appears dimmer. The brightness asymmetry here illustrates this effect. The colors and animation speed do not represent measurements of TON 618.",
  },
];

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <button
      className="toggle-row"
      role="switch"
      aria-checked={value}
      onClick={onChange}
    >
      <span>{label}</span>
      <span className={`switch ${value ? "on" : ""}`}>
        <i />
      </span>
    </button>
  );
}

export default function App() {
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<BlackHoleViewer | null>(null),
    audio = useRef<HTMLAudioElement | null>(null);
  const [mode, setMode] = useState<Mode>("observe"),
    [layer, setLayer] = useState<Layer>("disk");
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const [paused, setPaused] = useState(
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [orbit, setOrbit] = useState(false);
  const [lens, setLens] = useState(true),
    [disk, setDisk] = useState(true),
    [beaming, setBeaming] = useState(true),
    [exposure, setExposure] = useState(1);
  const [sound, setSound] = useState(false),
    [notes, setNotes] = useState(false),
    [help, setHelp] = useState(false),
    [cinema, setCinema] = useState(false);
  const [scaleZoom, setScaleZoom] = useState(false),
    [toast, setToast] = useState("");
  const [journey, setJourney] = useState<number | null>(null);
  const stop = journey === null ? null : journeySteps[journey];
  const metrics = scaleMetrics();
  useEffect(() => {
    let v: BlackHoleViewer;
    try {
      v = new BlackHoleViewer(host.current!);
      viewer.current = v;
      v.onFrame = () => {
        setReady(true);
        v.onFrame = undefined;
      };
    } catch {
      setError(
        "This browser could not start the live view. You can still explore the science and scale comparison below.",
      );
    }
    return () => {
      v?.dispose();
      viewer.current = null;
    };
  }, []);
  useEffect(() => {
    if (viewer.current) {
      viewer.current.paused = paused;
      viewer.current.orbit = orbit;
    }
  }, [paused, orbit]);
  useEffect(() => {
    viewer.current?.setLens(lens);
  }, [lens]);
  useEffect(() => {
    viewer.current?.setDisk(disk);
  }, [disk]);
  useEffect(() => {
    viewer.current?.setBeaming(beaming);
  }, [beaming]);
  useEffect(() => {
    viewer.current?.setExposure(exposure);
  }, [exposure]);
  useEffect(() => {
    viewer.current?.highlight(mode === "anatomy" && layer === "shadow");
  }, [mode, layer]);
  useEffect(() => {
    if (viewer.current) {
      viewer.current.suspended = mode === "scale" && !cinema;
      viewer.current.center(cinema);
    }
  }, [mode, cinema]);
  useEffect(() => {
    if (journey === null) return;
    setMode(journey === 3 ? "scale" : "observe");
    setLens(true);
    setDisk(true);
    setBeaming(true);
    setExposure(1);
    setOrbit(false);
    setScaleZoom(false);
    const [x, y, z] = journeySteps[journey].pose;
    viewer.current?.setPose(x, y, z);
  }, [journey]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotes(false);
        setHelp(false);
        setCinema(false);
        setJourney(null);
        setLens(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(
    () => () => {
      audio.current?.pause();
    },
    [],
  );
  const chooseMode = (next: Mode) => {
    setJourney(null);
    setLens(true);
    setMode(next);
    if (next === "anatomy") viewer.current?.setPose(0, 8.5, 24);
    if (next === "observe") viewer.current?.reset();
  };
  const reset = () => {
    setJourney(null);
    setLens(true);
    setDisk(true);
    setBeaming(true);
    setExposure(1);
    setOrbit(false);
    setPaused(false);
    viewer.current?.reset();
    setToast("View reset");
  };
  const toggleSound = async () => {
    if (!audio.current) {
      audio.current = new Audio(
        `${import.meta.env.BASE_URL}audio/original-score.mp3`,
      );
      audio.current.loop = true;
      audio.current.volume = 0.55;
    }
    if (sound) {
      audio.current.pause();
      setSound(false);
    } else {
      try {
        await audio.current.play();
        setSound(true);
      } catch {
        setToast("Sound could not load. Please try again.");
      }
    }
  };
  const capture = () => {
    if (!viewer.current) return;
    const a = document.createElement("a");
    a.href = viewer.current.capture();
    a.download = "ton-618-portrait.png";
    a.click();
    setToast("Portrait saved");
  };
  const active = chapters.find((c) => c.id === layer)!;
  return (
    <div
      className={`app mode-${mode} ${cinema ? "cinema" : ""} ${stop ? "journey" : ""}`}
    >
      <div
        ref={host}
        className="universe"
        style={
          error
            ? {
                backgroundImage: `url(${import.meta.env.BASE_URL}portrait.jpg)`,
              }
            : undefined
        }
      />
      <div className="shade" />
      <header className="masthead">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chooseMode("observe");
          }}
          aria-label="TON 618 home"
        >
          <span className="brand-mark" />
          <span>
            TON <b>618</b>
            <small>OBSERVATORY</small>
          </span>
        </a>
        <nav aria-label="Exhibit views">
          {(["observe", "anatomy", "scale"] as Mode[]).map((m, i) => (
            <button
              key={m}
              className={mode === m ? "active" : ""}
              onClick={() => chooseMode(m)}
            >
              <sup>0{i + 1}</sup>
              {m === "observe"
                ? "Observe"
                : m === "anatomy"
                  ? "Anatomy"
                  : "A sense of scale"}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="sound-button"
            aria-label={sound ? "Mute soundtrack" : "Play soundtrack"}
            onClick={toggleSound}
          >
            {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>Sound {sound ? "on" : "off"}</span>
          </button>
          <button
            className="icon-button"
            onClick={() => setNotes(true)}
            aria-label="Open science and sources"
          >
            <CircleHelp size={18} />
          </button>
        </div>
      </header>

      {!ready && !error && (
        <div className="loading" role="status">
          <span className="loading-ring" />
          Tracing the first light…
        </div>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <main>
        {mode === "observe" && !stop && (
          <>
            <section className="intro">
              <div className="eyebrow">
                <span /> BEYOND THE VISIBLE / VOL. 02
              </div>
              <h1>
                Where light
                <br />
                loses its <em>way.</em>
              </h1>
              <p>
                A journey to the black hole powering
                <br className="desktop" /> TON 618. An extraordinary darkness,
                <br className="desktop" /> revealed by the light around it.
              </p>
              <button
                className="text-link journey-start"
                onClick={() => setJourney(0)}
              >
                Begin the journey <ArrowUpRight size={18} />
              </button>
              <button
                className="free-explore"
                onClick={() => chooseMode("anatomy")}
              >
                Or explore freely
              </button>
            </section>
            <div className="object-tag">
              <span className="cross">+</span>
              <span>
                TON 618<small>ULTRAMASSIVE BLACK HOLE</small>
              </span>
            </div>
            <div className="hero-footnote">
              <span className="live-dot" /> LIVE INTERACTIVE VIEW{" "}
              <span className="divider" /> ARTISTIC INTERPRETATION
            </div>
          </>
        )}

        {stop && (
          <section className="journey-panel" aria-label="Guided journey">
            <div className="journey-steps" aria-label="Journey stops">
              {journeySteps.map((s, i) => (
                <button
                  key={s.title}
                  aria-label={`Stop ${i + 1}: ${s.title}`}
                  aria-current={journey === i ? "step" : undefined}
                  onClick={() => setJourney(i)}
                >
                  <span>0{i + 1}</span>
                </button>
              ))}
            </div>
            <div className="journey-copy" aria-live="polite">
              <div className="eyebrow">{stop.eyebrow}</div>
              <h1>{stop.title}</h1>
              <p>{stop.body}</p>
            </div>
            {journey === 1 && (
              <div className="journey-comparison">
                <Toggle
                  label="Bend the light"
                  value={lens}
                  onChange={() => setLens(!lens)}
                />
                <p>
                  {lens
                    ? "Curved light paths · the lensed view"
                    : "Straight light paths · comparison only"}
                </p>
              </div>
            )}
            {journey === 3 && (
              <button
                className="text-link"
                onClick={() => setScaleZoom(!scaleZoom)}
              >
                {scaleZoom
                  ? "Return to the full scale"
                  : "Look closer at our solar system"}
                <Focus size={17} />
              </button>
            )}
            <div className="journey-navigation">
              <button
                className="journey-back"
                disabled={journey === 0}
                onClick={() => setJourney((n) => Math.max(0, (n ?? 0) - 1))}
              >
                Back
              </button>
              <button
                className="text-link"
                onClick={() =>
                  journey === 3
                    ? chooseMode("observe")
                    : setJourney((n) => (n ?? 0) + 1)
                }
              >
                {journey === 3 ? "Explore on your own" : "Continue"}
                <ArrowUpRight size={17} />
              </button>
            </div>
            <button
              className="journey-exit"
              onClick={() => chooseMode("observe")}
            >
              Leave the journey
            </button>
          </section>
        )}

        {mode === "anatomy" && (
          <section className="anatomy-panel">
            <div className="eyebrow">THE ANATOMY OF AN ABSENCE</div>
            <h1>
              Read the <em>light.</em>
            </h1>
            <div className="chapter-list">
              {chapters.map((c) => (
                <button
                  key={c.id}
                  className={layer === c.id ? "selected" : ""}
                  onClick={() => setLayer(c.id)}
                >
                  <span>{c.number}</span>
                  {c.name}
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
            <article key={layer} className="chapter-copy">
              <h2>{active.subtitle}</h2>
              <p>{active.body}</p>
            </article>
            <div className="layer-controls">
              <Toggle
                label="Accretion disk"
                value={disk}
                onChange={() => setDisk(!disk)}
              />
              <Toggle
                label="Gravitational lensing"
                value={lens}
                onChange={() => setLens(!lens)}
              />
              <Toggle
                label="Doppler beaming"
                value={beaming}
                onChange={() => setBeaming(!beaming)}
              />
            </div>
          </section>
        )}

        {mode === "scale" && (
          <section className="scale-panel">
            <div className="scale-intro">
              <div className="eyebrow">A SENSE OF SCALE</div>
              <h1>
                Let that <br />
                <em>sink in.</em>
              </h1>
              <p>
                Neptune’s entire orbit would fit about{" "}
                <strong>{metrics.neptuneRatio.toFixed(0)} times</strong> across
                the event horizon’s diameter.
              </p>
              <div className="scale-assumption">
                Using 66 billion solar masses
                <br />
                and a nonrotating black hole.
              </div>
              <button
                className="text-link"
                onClick={() => setScaleZoom(!scaleZoom)}
              >
                {scaleZoom
                  ? "Return to the full scale"
                  : "Find our solar system"}{" "}
                <Focus size={18} />
              </button>
            </div>
            <div className={`scale-diagram ${scaleZoom ? "zoomed" : ""}`}>
              <div className="horizon-circle">
                <div className="horizon-text">
                  TON 618<span>EVENT HORIZON</span>
                </div>
                <div className="diameter-line">
                  <span>
                    ≈ {Math.round(metrics.diameterAU).toLocaleString()} AU
                  </span>
                </div>
              </div>
              <div
                className="solar-circle"
                style={{
                  width: `${100 / metrics.neptuneRatio}%`,
                  height: `${100 / metrics.neptuneRatio}%`,
                }}
              >
                <span className="sun" />
              </div>
              <div className="solar-label">
                <span />
                NEPTUNE’S ORBIT<small>60.14 AU ACROSS</small>
              </div>
            </div>
            <p className="scale-caption">
              Relative diameters are to scale. The Sun is enlarged for
              visibility.
              <br />1 AU is the average Earth–Sun distance. This compares sizes,
              not orbital behavior.
            </p>
          </section>
        )}
      </main>

      <aside className="readout" aria-label="Object facts">
        <div>
          <span>ESTIMATED MASS</span>
          <strong>
            66 <em>billion</em>
          </strong>
          <small>TIMES OUR SUN’S MASS</small>
        </div>
        <div>
          <span>LIGHT TRAVEL TIME</span>
          <strong>
            10+ <em>billion</em>
          </strong>
          <small>YEARS TO REACH US</small>
        </div>
        <button onClick={() => setNotes(true)}>
          Behind the numbers <ArrowUpRight size={13} />
        </button>
      </aside>

      <div className="bottom-bar">
        <div className="interaction-hint">
          <Orbit size={17} />
          <span>
            Drag to orbit <b>·</b> Scroll to move closer
          </span>
          <button aria-label="View controls" onClick={() => setHelp(true)}>
            ?
          </button>
        </div>
        <div className="controls" aria-label="Scene controls">
          <button
            className={orbit ? "enabled" : ""}
            aria-pressed={orbit}
            onClick={() => setOrbit(!orbit)}
            title="Automatic orbit"
          >
            <Orbit size={17} />
            <span>Orbit</span>
          </button>
          <button
            aria-label={paused ? "Play animation" : "Pause animation"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <div className="control-separator" />
          <label className="exposure">
            Glow
            <input
              aria-label="Glow intensity"
              type="range"
              min="0.35"
              max="1.8"
              step="0.05"
              value={exposure}
              onChange={(e) => setExposure(+e.target.value)}
            />
          </label>
          <div className="control-separator" />
          <button onClick={reset} aria-label="Reset view">
            <RotateCcw size={16} />
          </button>
          <button onClick={capture} aria-label="Save a portrait">
            <Download size={16} />
          </button>
          <button
            onClick={() => setCinema(!cinema)}
            aria-label={cinema ? "Exit cinema view" : "Enter cinema view"}
          >
            {cinema ? <X size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </div>
      <footer>
        <span>A STUDY IN LIGHT & GRAVITY</span>
        <div>
          <a
            href="https://hazzsaeedharis.github.io/iss-observatory/"
            target="_blank"
            rel="noreferrer"
          >
            Visit ISS Observatory <ArrowUpRight size={12} />
          </a>
          <a
            href="https://github.com/hazzsaeedharis/ton-618-observatory"
            target="_blank"
            rel="noreferrer"
            aria-label="View source on GitHub"
          >
            <Code2 size={14} />
          </a>
        </div>
        <button onClick={() => setNotes(true)}>
          Science-informed. Artistically interpreted.
        </button>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={15} />
          {toast}
        </div>
      )}
      {(notes || help) && (
        <Modal
          title={notes ? "What we know. What we imagine." : "Your observatory."}
          onClose={() => {
            setNotes(false);
            setHelp(false);
          }}
        >
          {notes ? (
            <>
              <p>
                TON 618 is a luminous quasar powered by one of the most massive
                known black holes. NASA’s scale comparison uses an estimated
                mass of 66 billion Suns. Mass estimates depend on the method;
                this exhibit uses that reference value rather than claiming a
                definitive record.
              </p>
              <h3>A model of light, not a photograph</h3>
              <p>
                This is a procedural artistic visualization inspired by black
                hole physics. We trace approximate light paths around a
                nonrotating black hole. The disk’s texture, color, orientation,
                and motion are illustrative; they are not observations of TON
                618. Spin, full relativistic radiative transfer, cosmological
                redshift, and real disk dynamics are not modeled.
              </p>
              <h3>Understanding the scale</h3>
              <p>
                The comparison uses the Schwarzschild radius, r = 2GM/c², giving
                a radius of approximately{" "}
                {Math.round(metrics.radiusAU).toLocaleString()} AU. The rendered
                dark shadow is larger than the event horizon. The solar
                comparison shows the event horizon itself.
              </p>
              <h3>Explore the sources</h3>
              <a
                className="source-link"
                href="https://svs.gsfc.nasa.gov/14335/"
                target="_blank"
                rel="noreferrer"
              >
                NASA / Sizing up the biggest black holes{" "}
                <ArrowUpRight size={16} />
              </a>
              <a
                className="source-link"
                href="https://science.nasa.gov/universe/black-holes/anatomy/"
                target="_blank"
                rel="noreferrer"
              >
                NASA / Anatomy of a black hole <ArrowUpRight size={16} />
              </a>
              <p className="small-note">
                Independent project by Haris. No NASA affiliation or
                endorsement. Original procedural visuals and original ambient
                score.
              </p>
            </>
          ) : (
            <>
              <p>
                Drag across the image to change your viewing angle. Scroll or
                pinch to move closer. Turn on Orbit for a slow automatic
                journey.
              </p>
              <p>
                <b>Anatomy</b> explains the disk, shadow, lensing, and
                brightness. Toggle each effect to see what changes.
              </p>
              <p>
                <b>A sense of scale</b> compares the event horizon with
                Neptune’s orbit. Select “Find our solar system” to inspect the
                smaller circle.
              </p>
              <p>
                Use the download button for a clean portrait, or the expand
                button for cinema view. Press Escape to close overlays or leave
                cinema view. Sound is optional and starts only when you choose
                it.
              </p>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="modal-inner">
        <button
          className="modal-close icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="eyebrow">FIELD NOTES / TON 618</div>
        <h2>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
