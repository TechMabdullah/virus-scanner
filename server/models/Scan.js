import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["file", "url"], required: true },
    target: { type: String, required: true }, // filename or URL
    sha256: { type: String },
    verdict: {
      type: String,
      enum: ["malicious", "suspicious", "harmless", "undetected"],
      required: true,
    },
    stats: {
      malicious: { type: Number, default: 0 },
      suspicious: { type: Number, default: 0 },
      harmless: { type: Number, default: 0 },
      undetected: { type: Number, default: 0 },
    },
    engines: [
      {
        engine: String,
        category: String,
        result: String,
      },
    ],
    permalink: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Scan", scanSchema);
