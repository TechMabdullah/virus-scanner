import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function Bug({ delay, radius, size, color }) {
  return (
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 3, ease: "linear", delay }}
      style={{ originX: "60px", originY: "60px" }}
    >
      <g transform={`translate(60 ${60 - radius})`}>
        <motion.g
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
        >
          {[-1, 1].map((side) =>
            [-1, 0, 1].map((i) => (
              <line
                key={`${side}-${i}`}
                x1={side * size * 0.35}
                y1={i * size * 0.28}
                x2={side * size * 0.9}
                y2={i * size * 0.5}
                stroke={color}
                strokeWidth={size * 0.09}
                strokeLinecap="round"
              />
            ))
          )}
          <ellipse cx="0" cy="0" rx={size * 0.32} ry={size * 0.42} fill={color} />
          <circle cx="0" cy={-size * 0.5} r={size * 0.2} fill={color} />
        </motion.g>
      </g>
    </motion.g>
  );
}

const STAGES = [
  { pct: 15, text: "Loading kernel modules…" },
  { pct: 40, text: "Loading virus definitions…" },
  { pct: 65, text: "Establishing secure channel…" },
  { pct: 88, text: "Warming up scan engine…" },
  { pct: 100, text: "Ready." },
];

export default function LoadingScreen({ durationMs = 1600, onDone }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(STAGES[0].text);

  useEffect(() => {
    let cancelled = false;
    const stepMs = durationMs / STAGES.length;

    STAGES.forEach((stage, i) => {
      setTimeout(() => {
        if (cancelled) return;
        setProgress(stage.pct);
        setStatusText(stage.text);
        if (i === STAGES.length - 1) onDone?.();
      }, stepMs * (i + 1));
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="loading-shell">
      <div className="loading-inner">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="#e2d8bf"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
          <Bug delay={0} radius={46} size={10} color="#5c7a5e" />
          <Bug delay={1} radius={46} size={8} color="#b5652c" />
          <Bug delay={2} radius={46} size={9} color="#7a5468" />
          <circle cx="60" cy="60" r="5" fill="#322d24" />
        </svg>

        <div className="loading-text">Sentinel</div>

        <div className="loading-progress-track">
          <motion.div
            className="loading-progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="loading-status">{statusText}</div>
      </div>
    </div>
  );
}
