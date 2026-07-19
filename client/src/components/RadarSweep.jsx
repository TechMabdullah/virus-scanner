import { motion } from "framer-motion";

export default function RadarSweep({ label }) {
  const rings = [1, 2, 3];

  return (
    <div className="radar-wrap">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0" />
            <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <circle cx="90" cy="90" r="85" fill="url(#radarGlow)" />

        {rings.map((r) => (
          <circle
            key={r}
            cx="90"
            cy="90"
            r={r * 26}
            fill="none"
            stroke="#223040"
            strokeWidth="1"
          />
        ))}

        {/* rotating sweep */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
          style={{ originX: "90px", originY: "90px" }}
        >
          <path d="M 90 90 L 90 5 A 85 85 0 0 1 145 28 Z" fill="url(#sweepGradient)" />
        </motion.g>

        {/* pulsing pings at a couple points to suggest activity being checked */}
        {[
          { x: 130, y: 60, delay: 0.3 },
          { x: 55, y: 120, delay: 1.1 },
          { x: 120, y: 130, delay: 1.7 },
        ].map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#e8a63c"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.6, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.2, delay: p.delay }}
          />
        ))}

        <circle cx="90" cy="90" r="4" fill="#4fd1c5" />
      </svg>
      <div className="radar-label">
        scanning <span className="radar-target">{label}</span>
      </div>
    </div>
  );
}
