import { createContext, useContext, useState, useCallback } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await client.post("/admin/login", { email, password });
      localStorage.setItem("mmv_access_token", res.data.accessToken);
      setAdmin(res.data.admin);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || "Login failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await client.post("/admin/logout").catch(() => {});
    localStorage.removeItem("mmv_access_token");
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
