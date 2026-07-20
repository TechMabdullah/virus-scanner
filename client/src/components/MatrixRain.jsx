import { useEffect, useRef } from "react";

const CHARS = "アイウエオカキクケコサシスセソ01アイウ0110101ABCDEF#*+=".split("");

export default function MatrixRain({ intensity = "normal" }) {
  const canvasRef = useRef(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height, columns, drops;
    const fontSize = 14;

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      columns = Math.floor(width / fontSize);
      drops = new Array(columns).fill(0).map(() => Math.random() * -50);
    }
    resize();
    window.addEventListener("resize", resize);

    let frame;
    let lastDraw = 0;
    function draw(ts) {
      const high = intensityRef.current === "high";
      const frameInterval = high ? 16 : 40; // faster refresh while "verifying"
      if (ts - lastDraw < frameInterval) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastDraw = ts;

      ctx.fillStyle = high ? "rgba(245, 239, 225, 0.14)" : "rgba(245, 239, 225, 0.2)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const isLeader = Math.random() > (high ? 0.85 : 0.94);
        ctx.fillStyle = isLeader
          ? high
            ? "#3f5941"
            : "#5c7a5e"
          : high
          ? "rgba(92, 122, 94, 0.55)"
          : "rgba(92, 122, 94, 0.28)";
        ctx.fillText(char, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += high ? 1.6 : 1;
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-canvas" />;
}
