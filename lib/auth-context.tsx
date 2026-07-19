"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Me } from "./api";

interface AuthContextValue {
  user: Me | null;
  isLoading: boolean;
  refresh: () => Promise<Me | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<Me>("/api/me");
      setUser(me);
      return me;
    } catch (e) {
      // 401 just means logged out — any other status is still "no session" from the UI's
      // point of view, so treat all failures the same rather than surfacing an error state
      // on every page load.
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
