import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAccessToken } from "../api.js";

export const AuthContext = createContext();

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStoredUser = (userData) => {
  try {
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  } catch {
    // storage disabled / full — non-fatal, user still works in-memory
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const clearAuthState = useCallback(() => {
    setUser(null);
    setError(null);
    setAccessToken(null);
    writeStoredUser(null);
  }, []);

  const logout = useCallback(async () => {
    setIsAuthProcessing(true);
    try {
      await api.post("/api/user/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuthState();
      setIsAuthProcessing(false);
      navigate("/login");
    }
  }, [clearAuthState, navigate]);

  const login = useCallback(async (email, password) => {
    setIsAuthProcessing(true);
    setError(null);
    try {
      const response = await api.post("/api/user/login", { email, password });

      if (!response.data?.accessToken) {
        throw new Error("Server response missing access token");
      }

      const { accessToken, user: userData } = response.data;

      setAccessToken(accessToken);
      setUser(userData);
      writeStoredUser(userData);

      return userData;
    } catch (err) {
      clearAuthState();
      throw err;
    } finally {
      setIsAuthProcessing(false);
    }
  }, [clearAuthState]);

  const signupUser = useCallback(async (userData) => {
    setIsAuthProcessing(true);
    try {
      const response = await api.post("/api/user/signup", userData);
      return response.data;
    } catch (err) {
      console.error("Signup Error:", err.message);
      throw err;
    } finally {
      setIsAuthProcessing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Always attempt silent refresh — cookie is the source of truth,
        // not localStorage. This restores sessions across browsers/tabs
        // where localStorage was cleared but the cookie is still valid.
        const res = await api.post("/api/user/refresh");
        setAccessToken(res.data.accessToken);

        const profileRes = await api.get("/api/user/profile");
        const freshUser = profileRes.data?.userData || profileRes.data;

        if (isMounted && freshUser) {
          setUser(freshUser);
          writeStoredUser(freshUser);
        }
      } catch (e) {
        // No valid session — user is genuinely logged out.
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    const handleLogoutEvent = () => clearAuthState();

    window.addEventListener("auth:logout", handleLogoutEvent);
    initializeAuth();

    return () => {
      isMounted = false;
      window.removeEventListener("auth:logout", handleLogoutEvent);
    };
  }, [clearAuthState]);

  const contextValue = {
    user,
    isInitializing,
    isAuthProcessing,
    error,
    login,
    logout,
    signupUser,
    setUser,
    setAccessToken,
    clearAuthState,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};