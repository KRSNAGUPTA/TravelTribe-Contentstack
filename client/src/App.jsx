import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./middlewares/protectedRoutes";
import Loading from "./pages/Loading";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { applyTheme } from "./lib/applyTheme";
import { fetchEntries } from "./contentstack/utils";
import { LyticsProvider } from "./context/LyticsContext";
import { StickyBar } from "./components/StickyBanner";

const HomePage = lazy(() => import("./pages/HomePage"));
const HostelPage = lazy(() => import("./pages/HostelsPage"));
const HostelDetails = lazy(() => import("./pages/HostelDetails"));
const HostelBooking = lazy(() => import("./pages/BookHostel"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contact = lazy(() => import("./pages/Contact"));

function App() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadTheme() {
      try {
        const entries = await fetchEntries(
          "website_theme",
          import.meta.env.VITE_SDK,
          null
        );
        const entry = entries?.[0];
        const base = entry?.primary_color?.hex;

        if (!base) {
          console.warn("Theme color not found");
          return;
        }

        if (mounted) {
          applyTheme(base);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    }

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Router>
      <LyticsProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <Suspense fallback={<Loading />}>
              <StickyBar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/hostel" element={<HostelPage />} />
                <Route path="/hostel/:id" element={<HostelDetails />} />
                <Route
                  path="/hostel/:id/book"
                  element={
                    <ProtectedRoute>
                      <HostelBooking />
                    </ProtectedRoute>
                  }
                />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </GoogleOAuthProvider>
      </LyticsProvider>
    </Router>
  );
}

export default App;