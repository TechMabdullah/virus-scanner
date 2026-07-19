import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import scanRoutes from "./routes/scan.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

async function start() {
  try {
    await connectDB(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/virus-scanner");
    app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error("[server] failed to start:", err.message);
    process.exit(1);
  }
}

start();
