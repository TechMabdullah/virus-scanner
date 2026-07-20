import { useState } from "react";
import { motion } from "framer-motion";
import Scanner from "./components/Scanner.jsx";
import History from "./components/History.jsx";
import TerminalAuth from "./components/TerminalAuth.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function App() {
  const { isAuthed, checking, username, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [bootDone, setBootDone] = useState(false);

  if (checking || !bootDone) {
    return <LoadingScreen onDone={() => setBootDone(true)} />;
  }

  if (!isAuthed) {
    return <TerminalAuth />;
  }

  return (
    <motion.div
      className="app-shell"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <motion.div
        className="topbar"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="brand">
          <span className="dot" />
          <div>
            <h1>Sentinel</h1>
            <p className="subtitle">File & URL threat scanning, powered by VirusTotal</p>
          </div>
        </div>
        <div className="user-chip">
          <span>
            signed in as <strong>{username}</strong>
          </span>
          <button className="logout-btn" onClick={logout}>
            log out
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
      >
        <Scanner onScanComplete={() => setRefreshKey((k) => k + 1)} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
      >
        <History refreshKey={refreshKey} />
      </motion.div>
    </motion.div>
  );
}
