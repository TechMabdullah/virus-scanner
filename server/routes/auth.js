import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Username required, and password must be at least 6 characters." });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(409).json({ error: "That username is already taken." });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ username: username.toLowerCase(), passwordHash });

    res.status(201).json({ token: signToken(user), username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid username or password." });

    const ok = await user.checkPassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid username or password." });

    res.json({ token: signToken(user), username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("username createdAt");
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json(user);
});

export default router;
