import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAccessToken } from "../api.js";
import { trackEvent } from "@/Lytics/config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [isInitializing, setIsInitializing] = useState(() => {
    return !!localStorage.getItem("user");
  });

  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const clearAuthState = () => {
    setUser(null);
    setError(null);
    setAccessToken(null);
    localStorage.removeItem("user");
  };

  const logout = async () => {
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
  };

  const login = async (email, password) => {
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
      localStorage.setItem("user", JSON.stringify(userData));

      trackEvent("user_login", {
        email: userData.email,
        name: userData.name,
      });

      return userData;
    } catch (error) {
      clearAuthState();
      throw error;
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const signupUser = async (userData) => {
    setIsAuthProcessing(true);
    try {
      const response = await api.post("/api/user/signup", userData);
      trackEvent("user_signup", {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
      });
      return response.data;
    } catch (error) {
      console.error("Signup Error:", error.message);
      throw error;
    } finally {
      setIsAuthProcessing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (!localStorage.getItem("user")) {
        if (isMounted) setIsInitializing(false);
        return;
      }

      try {
        const res = await api.post("/api/user/refresh");
        setAccessToken(res.data.accessToken);

        const profileRes = await api.get("/api/user/profile");
        const freshUser = profileRes.data.userData || profileRes.data;

        if (isMounted) {
          setUser(freshUser);
          localStorage.setItem("user", JSON.stringify(freshUser));
        }
      } catch (e) {
        console.error("Silent refresh failed on refresh:", e.message);
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    window.addEventListener("auth:logout", clearAuthState);
    initializeAuth();

    return () => {
      isMounted = false;
      window.removeEventListener("auth:logout", clearAuthState);
    };
  }, []);

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