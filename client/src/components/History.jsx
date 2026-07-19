import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function History({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await axios.get("/api/scan/history");
      setItems(res.data);
    } catch {
      // silent — history is non-critical to the main flow
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function clearHistory() {
    await axios.delete("/api/scan/history");
    setItems([]);
  }

  return (
    <div>
      <div className="section-title">
        <span>Scan history</span>
        {items.length > 0 && (
          <button className="clear-btn" onClick={clearHistory}>
            clear all
          </button>
        )}
      </div>

      {!loading && items.length === 0 && (
        <div className="empty-state">No scans yet. Run one above to see it here.</div>
      )}

      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item._id}
            className="history-item"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            layout
          >
            <span className={`history-dot ${item.verdict}`} />
            <span className="history-target">{item.target}</span>
            <span className="history-meta">
              {item.stats.malicious > 0
                ? `${item.stats.malicious} flagged`
                : "clean"}{" "}
              · {timeAgo(item.createdAt)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
