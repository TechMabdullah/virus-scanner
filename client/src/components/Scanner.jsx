import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api.js";
import RadarSweep from "./RadarSweep.jsx";

const verdictLabel = {
  malicious: "Malicious",
  suspicious: "Suspicious",
  harmless: "Clean",
  undetected: "Clean",
};

export default function Scanner({ onScanComplete }) {
  const [mode, setMode] = useState("file"); // "file" | "url"
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const canScan = mode === "file" ? !!file : url.trim().length > 3;

  async function runScan() {
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      let res;
      if (mode === "file") {
        const form = new FormData();
        form.append("file", file);
        res = await api.post("/api/scan/file", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/api/scan/url", { url: url.trim() });
      }
      setResult(res.data);
      onScanComplete?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Scan failed. Check the server logs.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="panel">
      <div className="tabs">
        <button
          className={`tab ${mode === "file" ? "active" : ""}`}
          onClick={() => {
            setMode("file");
            setResult(null);
            setError(null);
          }}
        >
          File
        </button>
        <button
          className={`tab ${mode === "url" ? "active" : ""}`}
          onClick={() => {
            setMode("url");
            setResult(null);
            setError(null);
          }}
        >
          URL
        </button>
      </div>

      {!scanning && (
        <>
          {mode === "file" ? (
            <div
              className={`drop-zone ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
              }}
            >
              {file ? (
                <span className="filename">{file.name}</span>
              ) : (
                <span>Drop a file here, or click to browse (max 32MB)</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          ) : (
            <input
              className="url-input"
              placeholder="https://example.com/suspicious-link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          )}

          <button className="scan-btn" disabled={!canScan} onClick={runScan}>
            Run scan
          </button>

          <AnimatePresence>
            {error && (
              <motion.div
                className="error-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RadarSweep label={mode === "file" ? file?.name : url} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !scanning && (
          <motion.div
            className="result-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="verdict-row">
              <span className={`verdict-badge ${result.verdict}`}>
                {verdictLabel[result.verdict]}
              </span>
              <span className="target-name">{result.target}</span>
            </div>

            <div className="stat-grid">
              <div className="stat-box">
                <div className="num" style={{ color: "var(--red)" }}>
                  {result.stats.malicious}
                </div>
                <div className="label">Malicious</div>
              </div>
              <div className="stat-box">
                <div className="num" style={{ color: "var(--amber)" }}>
                  {result.stats.suspicious}
                </div>
                <div className="label">Suspicious</div>
              </div>
              <div className="stat-box">
                <div className="num" style={{ color: "var(--green)" }}>
                  {result.stats.harmless}
                </div>
                <div className="label">Harmless</div>
              </div>
              <div className="stat-box">
                <div className="num" style={{ color: "var(--text-dim)" }}>
                  {result.stats.undetected}
                </div>
                <div className="label">Undetected</div>
              </div>
            </div>

            {result.engines?.length > 0 && (
              <div>
                {result.engines.slice(0, 8).map((e, i) => (
                  <div className="engine-row" key={i}>
                    <span className="engine-name">{e.engine}</span>
                    <span className="engine-result">{e.result || e.category}</span>
                  </div>
                ))}
              </div>
            )}

            {result.permalink && (
              <a
                className="permalink"
                href={result.permalink}
                target="_blank"
                rel="noreferrer"
              >
                View full report on VirusTotal →
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
