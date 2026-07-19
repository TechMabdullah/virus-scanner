import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("sentinel_token"));
  const [username, setUsername] = useState(() => localStorage.getItem("sentinel_username"));
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    // Validate the stored token once on load
    async function check() {
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        await axios.get("/api/auth/me");
      } catch {
        logout();
      } finally {
        setChecking(false);
      }
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await axios.post("/api/auth/login", { username, password });
    persist(res.data);
  }, []);

  const register = useCallback(async (username, password) => {
    const res = await axios.post("/api/auth/register", { username, password });
    persist(res.data);
  }, []);

  function persist(data) {
    localStorage.setItem("sentinel_token", data.token);
    localStorage.setItem("sentinel_username", data.username);
    setToken(data.token);
    setUsername(data.username);
  }

  function logout() {
    localStorage.removeItem("sentinel_token");
    localStorage.removeItem("sentinel_username");
    setToken(null);
    setUsername(null);
  }

  return (
    <AuthContext.Provider
      value={{ token, username, checking, login, register, logout, isAuthed: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
