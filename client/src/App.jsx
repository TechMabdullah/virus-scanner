import { useState } from "react";
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
    <div className="app-shell">
      <div className="topbar">
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
      </div>

      <Scanner onScanComplete={() => setRefreshKey((k) => k + 1)} />

      <History refreshKey={refreshKey} />
    </div>
  );
}
