import axios from "axios";

// In dev, VITE_API_URL is unset and requests go through the Vite proxy (see vite.config.js).
// In prod (Vercel), set VITE_API_URL to your deployed backend's URL, e.g.
// https://your-backend.onrender.com
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

export default api;
