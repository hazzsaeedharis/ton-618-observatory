import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { scaleMetrics } from "./science.mjs";

export default function ScaleJourney({
  focusRequest,
}: {
  focusRequest: number;
}) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const metrics = scaleMetrics();
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const [playing, setPlaying] = useState(!reduced);
  const current = useRef(progress),
    moving = useRef(playing),
    previousFocus = useRef(focusRequest);
  const motion = useRef({ from: 0, to: 1, elapsed: 0, duration: 11 });
  moving.current = playing;
  const moveTo = (target: number, duration: number) => {
    if (reduced) {
      current.current = target;
      setProgress(target);
      setPlaying(false);
      return;
    }
    motion.current = {
      from: current.current,
      to: target,
      elapsed: 0,
      duration,
    };
    setPlaying(true);
  };
  useEffect(() => {
    if (previousFocus.current === focusRequest) return;
    previousFocus.current = focusRequest;
    moveTo(0, 4);
  }, [focusRequest]);
  useEffect(() => {
    let frame = 0,
      previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (moving.current && !document.hidden) {
        const m = motion.current;
        m.elapsed = Math.min(m.duration, m.elapsed + dt);
        const t = m.elapsed / m.duration,
          e = t * t * (3 - 2 * t);
        current.current = m.from + (m.to - m.from) * e;
        setProgress(current.current);
        if (t === 1) {
          moving.current = false;
          setPlaying(false);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  const widthAU = 100 * Math.pow((metrics.diameterAU * 1.22) / 100, progress);
  const horizon = (metrics.radiusAU / widthAU) * 600,
    neptune = (30.07 / widthAU) * 600;
  return (
    <div className="scale-diagram continuous-scale">
      <svg
        viewBox="0 0 600 600"
        role="img"
        aria-label="To-scale comparison of TON 618’s event horizon with Neptune’s orbit"
      >
        <defs>
          <radialGradient id="horizon-glow">
            <stop offset="0.84" stopColor="#e6b97a" stopOpacity="0" />
            <stop offset=".94" stopColor="#e6b97a" stopOpacity=".12" />
            <stop offset="1" stopColor="#e6b97a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          cx="300"
          cy="300"
          r={horizon * 1.08}
          fill="url(#horizon-glow)"
        />
        <circle
          cx="300"
          cy="300"
          r={horizon}
          fill="#080909"
          stroke="#b89a76"
          strokeWidth="1.2"
        />
        <circle
          cx="300"
          cy="300"
          r={neptune}
          fill="none"
          stroke="#a7c9cc"
          strokeWidth="1.5"
        />
        <circle cx="300" cy="300" r="2.4" fill="#f0dab0" />
        {progress > 0.73 && (
          <g opacity={Math.min(1, (progress - 0.73) / 0.15)}>
            <text x="300" y="150" className="scale-svg-title">
              TON 618
            </text>
            <text x="300" y="176" className="scale-svg-sub">
              EVENT HORIZON
            </text>
            <text x="300" y="477" className="scale-svg-value">
              ≈ 2,606 AU across
            </text>
          </g>
        )}
        <path
          d={`M ${300 + neptune + 8} 300 H ${Math.min(300 + neptune + 35, 512)}`}
          stroke="#91acae"
          strokeWidth="1"
        />
        <text
          x={Math.min(300 + neptune + 40, 505)}
          y="290"
          className="scale-svg-label"
        >
          NEPTUNE
        </text>
        <text
          x={Math.min(300 + neptune + 40, 505)}
          y="310"
          className="scale-svg-label small"
        >
          60.14 AU orbit
        </text>
        <text x="300" y="40" className="scale-svg-sub">
          {progress < 0.3
            ? "OUR OUTER NEIGHBORHOOD"
            : progress < 0.78
              ? "KEEP PULLING BACK"
              : "ONE EVENT HORIZON"}
        </text>
      </svg>
      <div className="scale-playback">
        <div className="scale-playback-label">
          <span>
            {Math.round(widthAU).toLocaleString()} AU across this view
          </span>
          <span>TRUE RELATIVE SCALE</span>
        </div>
        <div className="scale-playback-row">
          <button
            aria-label={playing ? "Pause scale journey" : "Play scale journey"}
            onClick={() => {
              if (playing) setPlaying(false);
              else if (
                current.current >= 0.999 ||
                motion.current.elapsed >= motion.current.duration
              ) {
                current.current = 0;
                setProgress(0);
                moveTo(1, 11);
              } else setPlaying(true);
            }}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <input
            aria-label="Scale perspective"
            type="range"
            min="0"
            max="100"
            step=".1"
            value={progress * 100}
            onChange={(e) => {
              const p = +e.target.value / 100;
              current.current = p;
              setProgress(p);
              setPlaying(false);
              motion.current = {
                from: p,
                to: 1,
                elapsed: 0,
                duration: 11 * (1 - p) || 1,
              };
            }}
          />
          <button
            aria-label="Replay scale pullback"
            onClick={() => {
              current.current = 0;
              setProgress(0);
              moveTo(1, 11);
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
        <div className="scale-endpoints">
          <span>Neptune’s neighborhood</span>
          <span>TON 618</span>
        </div>
      </div>
    </div>
  );
}
