"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext({
  user: null,
  status: "loading", // "loading" | "authenticated" | "unauthenticated"
  session: null,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  // Session restoration on startup
  const restoreSession = useCallback(async () => {
    try {
      setStatus("loading");
      const res = await authService.getCurrentUser();

      if (res && res.authenticated && res.user) {
        setUser(res.user);
        setSession(res.session || null);
        setStatus("authenticated");
      } else {
        setUser(null);
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch (err) {
      setUser(null);
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(
    async ({ email, password }) => {
      setError(null);
      try {
        const result = await authService.signIn({ email, password });
        if (result && result.user) {
          setUser(result.user);
          setStatus("authenticated");
        }
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [],
  );

  const signUp = useCallback(
    async ({ name, email, password, confirmPassword }) => {
      setError(null);
      try {
        const result = await authService.signUp({
          name,
          email,
          password,
          confirmPassword,
        });
        if (result && result.user) {
          setUser(result.user);
          setStatus("authenticated");
        }
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await authService.signOut();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = {
    user,
    session,
    status,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession: restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
}

export default useAuth;
