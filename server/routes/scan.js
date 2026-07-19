import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import Scan from "../models/Scan.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 32 * 1024 * 1024 } });

const VT_BASE = "https://www.virustotal.com/api/v3";

function vtClient() {
  return axios.create({
    baseURL: VT_BASE,
    headers: { "x-apikey": process.env.VT_API_KEY },
  });
}

// Poll an analysis id until VirusTotal finishes processing it
async function pollAnalysis(client, analysisId, { intervalMs = 3000, maxAttempts = 20 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data } = await client.get(`/analyses/${analysisId}`);
    const status = data.data.attributes.status;
    if (status === "completed") return data.data;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Analysis timed out — VirusTotal is still processing this sample.");
}

function deriveVerdict(stats) {
  if (stats.malicious > 0) return "malicious";
  if (stats.suspicious > 0) return "suspicious";
  if (stats.harmless > 0) return "harmless";
  return "undetected";
}

function extractEngines(analysisResult) {
  const results = analysisResult.attributes.results || {};
  return Object.entries(results)
    .filter(([, v]) => v.category === "malicious" || v.category === "suspicious")
    .map(([engine, v]) => ({ engine, category: v.category, result: v.result }));
}

// --- Scan a file ---
router.post("/file", upload.single("file"), async (req, res) => {
  try {
    if (!process.env.VT_API_KEY) {
      return res.status(500).json({ error: "VT_API_KEY is not configured on the server." });
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const client = vtClient();

    const form = new FormData();
    form.append("file", req.file.buffer, req.file.originalname);

    const uploadRes = await client.post("/files", form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const analysisId = uploadRes.data.data.id;
    const analysis = await pollAnalysis(client, analysisId);

    const stats = analysis.attributes.stats;
    const sha256 = analysis.meta?.file_info?.sha256;
    const verdict = deriveVerdict(stats);
    const engines = extractEngines(analysis);

    const scan = await Scan.create({
      user: req.userId,
      type: "file",
      target: req.file.originalname,
      sha256,
      verdict,
      stats,
      engines,
      permalink: sha256 ? `https://www.virustotal.com/gui/file/${sha256}` : undefined,
    });

    res.json(scan);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// --- Scan a URL ---
router.post("/url", async (req, res) => {
  try {
    if (!process.env.VT_API_KEY) {
      return res.status(500).json({ error: "VT_API_KEY is not configured on the server." });
    }
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No url provided." });

    const client = vtClient();

    const form = new URLSearchParams();
    form.append("url", url);

    const submitRes = await client.post("/urls", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const analysisId = submitRes.data.data.id;
    const analysis = await pollAnalysis(client, analysisId);

    const stats = analysis.attributes.stats;
    const verdict = deriveVerdict(stats);
    const engines = extractEngines(analysis);
    const urlId = Buffer.from(url).toString("base64").replace(/=+$/, "");

    const scan = await Scan.create({
      user: req.userId,
      type: "url",
      target: url,
      verdict,
      stats,
      engines,
      permalink: `https://www.virustotal.com/gui/url/${urlId}`,
    });

    res.json(scan);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// --- History ---
router.get("/history", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const scans = await Scan.find({ user: req.userId }).sort({ createdAt: -1 }).limit(limit);
    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/history", async (req, res) => {
  try {
    await Scan.deleteMany({ user: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
