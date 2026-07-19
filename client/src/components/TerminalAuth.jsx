import { useState, useRef, useEffect } from "react";
import { useAuth } from "../AuthContext.jsx";
import MatrixRain from "./MatrixRain.jsx";
import AccessBurst from "./AccessBurst.jsx";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const ASCII_LOGO = String.raw`
 ____             _   _            _
/ ___|  ___ _ __ | |_(_)_ __   ___| |
\___ \ / _ \ '_ \| __| | '_ \ / _ \ |
 ___) |  __/ | | | |_| | | | |  __/ |
|____/ \___|_| |_|\__|_|_| |_|\___|_|
`.replace(/^\n/, "");

const BOOT_LINES = [
  { type: "hint", text: "establishing handshake with sentinel-core…" },
  { type: "hint", text: "node 10.42.0.7 — latency 23ms" },
  { type: "hint", text: "encryption AES-256 — OK" },
  { type: "system", text: "sentinel-auth v1.0 — secure console" },
  { type: "hint", text: "type: start user-login   or   start user-register" },
  { type: "hint", text: "type: help   for a full command list" },
];

function useUptime() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function TerminalAuth() {
  const { login, register } = useAuth();
  const [lines, setLines] = useState([]);
  const [booting, setBooting] = useState(true);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("idle"); // idle | awaiting-login | awaiting-register | busy
  const [verifyDots, setVerifyDots] = useState("");
  const [fx, setFx] = useState("");
  const [glitching, setGlitching] = useState(true);
  const [threats, setThreats] = useState(48213);
  const [showBurst, setShowBurst] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const uptime = useUptime();

  // Typewriter-reveal the boot lines line by line on mount
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      for (const line of BOOT_LINES) {
        if (cancelled) return;
        await delay(line.type === "hint" ? 260 : 320);
        setLines((prev) => [...prev, { ...line, id: prev.length }]);
      }
      setBooting(false);
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines, booting]);

  // Periodically re-trigger the logo glitch for atmosphere
  useEffect(() => {
    const t = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 550);
    }, 6500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setGlitching(false), 550);
    return () => clearTimeout(t);
  }, []);

  // Fake ambient threat counter ticking up
  useEffect(() => {
    const t = setInterval(() => {
      setThreats((v) => v + Math.floor(Math.random() * 3));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  // Lockout countdown after too many failed attempts
  useEffect(() => {
    if (mode !== "locked") return;
    if (lockSeconds <= 0) {
      setMode("idle");
      setFailedAttempts(0);
      push("hint", "lockout lifted — you may try again");
      return;
    }
    const t = setTimeout(() => setLockSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lockSeconds]);

  const attemptsRef = useRef(0);

  function registerFailure() {
    attemptsRef.current += 1;
    setFailedAttempts(attemptsRef.current);
    if (attemptsRef.current >= 3) {
      setLockSeconds(10);
      push("lockout", `too many failed attempts — locked for 10s`);
      attemptsRef.current = 0;
      return true;
    }
    return false;
  }


  useEffect(() => {
    if (mode !== "busy") return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % 4;
      setVerifyDots(".".repeat(i));
    }, 300);
    return () => clearInterval(t);
  }, [mode]);

  function push(type, text) {
    setLines((prev) => [...prev, { type, text, id: prev.length }]);
  }

  function pushEcho(prompt, text) {
    setLines((prev) => [...prev, { type: "input-echo", text, prompt, id: prev.length }]);
  }

  function triggerFx(kind, ms) {
    setFx(kind);
    setTimeout(() => setFx(""), ms);
  }

  async function runCredentialFlow(kind, raw) {
    const [, payload] = raw.split("=");
    const atIndex = payload?.indexOf("@") ?? -1;

    if (!payload || atIndex === -1) {
      push("error", `malformed input — expected user-${kind}=<username>@<password>`, true);
      triggerFx("shake", 400);
      return;
    }

    const username = payload.slice(0, atIndex);
    const password = payload.slice(atIndex + 1);

    setMode("busy");
    push("system", "verifying");
    await delay(900);

    try {
      if (kind === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      push("system", "verified");
      setShowBurst(true);
      triggerFx("success-flash", 900);
      await delay(900);
      setShowBurst(false);
      push("system", "logged-in");
    } catch (err) {
      const msg = err.response?.data?.error || "authentication failed";
      push("error", `access denied — ${msg}`);
      triggerFx("shake", 400);
      const locked = registerFailure();
      setMode(locked ? "locked" : "idle");
    }
  }

  async function handleCommand(cmd) {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    if (mode === "awaiting-login") {
      pushEcho(">", trimmed);
      if (trimmed.startsWith("user-login=")) await runCredentialFlow("login", trimmed);
      else {
        push("error", "expected: user-login=<username>@<password>");
        triggerFx("shake", 400);
      }
      return;
    }

    if (mode === "awaiting-register") {
      pushEcho(">", trimmed);
      if (trimmed.startsWith("user-register=")) await runCredentialFlow("register", trimmed);
      else {
        push("error", "expected: user-register=<username>@<password>");
        triggerFx("shake", 400);
      }
      return;
    }

    pushEcho("$", trimmed);

    if (trimmed === "start user-login") {
      setMode("awaiting-login");
      push("hint", "enter: user-login=<username>@<password>");
    } else if (trimmed === "start user-register") {
      setMode("awaiting-register");
      push("hint", "enter: user-register=<username>@<password>");
    } else if (trimmed === "help") {
      push("system", "available commands:");
      push("hint", "  start user-login       begin login flow");
      push("hint", "  start user-register    create a new account");
      push("hint", "  clear                  clear the console");
    } else if (trimmed === "clear") {
      setLines([]);
    } else {
      push("error", `command not found: ${trimmed}`);
      triggerFx("shake", 400);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (mode === "busy" || mode === "locked" || booting) return;
    const cmd = input;
    setInput("");
    await handleCommand(cmd);
  }

  const prompt = mode === "awaiting-login" || mode === "awaiting-register" ? ">" : "$";

  return (
    <div className="terminal-shell">
      <MatrixRain intensity={mode === "busy" ? "high" : "normal"} />
      <div className={`terminal-card ${fx}`} onClick={() => inputRef.current?.focus()}>
        <div className="terminal-titlebar">
          <span
            className={`terminal-dot ${mode === "locked" ? "locked-pulse" : ""}`}
            style={{ background: "#e0645a" }}
          />
          <span className="terminal-dot" style={{ background: "#e0b95a" }} />
          <span className="terminal-dot" style={{ background: "#6fbf7a" }} />
          <span className="label">sentinel — secure console</span>
        </div>

        <div className="terminal-hud">
          <div>UPTIME <span className="hud-value">{uptime}</span></div>
          <div>THREATS BLOCKED <span className="hud-value">{threats.toLocaleString()}</span></div>
        </div>

        {showBurst && <AccessBurst />}

        <div className="terminal-body" ref={bodyRef}>
          <div className="ascii-logo-wrap">
            <pre className={`ascii-logo ${glitching ? "glitching" : ""}`}>{ASCII_LOGO}</pre>
            {glitching && (
              <>
                <pre className="ascii-logo-ghost cyan">{ASCII_LOGO}</pre>
                <pre className="ascii-logo-ghost red">{ASCII_LOGO}</pre>
              </>
            )}
          </div>

          {lines.map((line) => (
            <div
              key={line.id}
              className={`terminal-line ${line.type} ${line.type === "error" ? "glitch-text" : ""}`}
            >
              {line.type === "input-echo" ? (
                <>
                  <span className="prompt">{line.prompt}</span> {line.text}
                </>
              ) : line.type === "system" && line.text === "verifying" && mode === "busy" ? (
                <>{line.text}{verifyDots}</>
              ) : (
                line.text
              )}
            </div>
          ))}

          {mode === "locked" && (
            <div className="terminal-line lockout">
              🔒 locked — retry in {lockSeconds}s
            </div>
          )}

          {!booting && mode !== "busy" && mode !== "locked" && (
            <form onSubmit={onSubmit}>
              <div className="terminal-input-row">
                <span className="prompt">{prompt}</span>
                <input
                  ref={inputRef}
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                />
                <span className="terminal-caret" />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
