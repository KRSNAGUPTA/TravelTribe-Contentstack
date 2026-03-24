import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./middlewares/protectedRoutes";
import Loading from "./pages/Loading";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { applyTheme } from "./lib/applyTheme";
import { fetchEntryById } from "./contentstack/utils";
import detectAdBlocker from "./lib/detectAdBlocker";
import AdBlockNotice from "./components/AdBlockNotice";
import { LyticsProvider } from "./context/LyticsContext";

const HomePage = lazy(() => import("./pages/HomePage"));
const HostelPage = lazy(() => import("./pages/HostelsPage"));
const HostelDetails = lazy(() => import("./pages/HostelDetails"));
const HostelBooking = lazy(() => import("./pages/BookHostel"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contact = lazy(() => import("./pages/Contact"));

function App() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Guard against duplicate initialization (index.html or prior injection).
    if (window.jstag || document.getElementById("lytics-js-tag")) {
      return;
    }

    const scriptEl = document.createElement("script");
    scriptEl.id = "lytics-js-tag";
    scriptEl.type = "text/javascript";
    scriptEl.text = `
      !(function () {
        "use strict";
        var o = window.jstag || (window.jstag = {}),
          r = [];
        function n(e) {
          o[e] = function () {
            for (var n = arguments.length, t = new Array(n), i = 0; i < n; i++)
              t[i] = arguments[i];
            r.push([e, t]);
          };
        }
        (n("send"),
          n("mock"),
          n("identify"),
          n("pageView"),
          n("unblock"),
          n("getid"),
          n("setid"),
          n("loadEntity"),
          n("getEntity"),
          n("on"),
          n("once"),
          n("call"),
          (o.loadScript = function (n, t, i) {
            var e = document.createElement("script");
            ((e.async = !0), (e.src = n), (e.onload = t), (e.onerror = i));
            var o = document.getElementsByTagName("script")[0],
              r = (o && o.parentNode) || document.head || document.body,
              c = o || r.lastChild;
            return (null != c ? r.insertBefore(e, c) : r.appendChild(e), this);
          }),
          (o.init = function n(t) {
            return (
              (this.config = t),
              this.loadScript(t.src, function () {
                if (o.init === n) throw new Error("Load error!");
                (o.init(o.config),
                  (function () {
                    for (var n = 0; n < r.length; n++) {
                      var t = r[n][0],
                        i = r[n][1];
                      o[t].apply(o, i);
                    }
                    r = void 0;
                  })());
              }),
              this
            );
          }));
      })();

      jstag.init({
        src: "https://c.lytics.io/api/tag/6a03218477b4c778f5bda02df0347688/latest.min.js"
      });

      jstag.pageView();
    `;

    document.head.appendChild(scriptEl);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadTheme() {
      const entry = await fetchEntryById(
        "website_theme",
        "blt1536a6f67fbc5110",
        import.meta.env.VITE_SDK,
        null,
      );
      // console.log("Theme entry:", entry);
      const base = entry?.primary_color?.hex;
      // console.log("Theme base color:", base);

      if (!base) {
        console.warn("Theme color not found");
        return;
      }
      if (mounted) {
        applyTheme(base);
      }
    }
    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const runDetection = async () => {
      const blocked = await detectAdBlocker();
      if (mounted) {
        setAdBlockDetected(blocked);
      }
    };

    runDetection();

    return () => {
      mounted = false;
    };
  }, []);

  const retryAdBlockCheck = async () => {
    const blocked = await detectAdBlocker();
    setAdBlockDetected(blocked);
  };

  if (adBlockDetected) {
    return <AdBlockNotice onRetry={retryAdBlockCheck} />;
  }

  return (
    <Router>
      <LyticsProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <Suspense fallback={<Loading />}>
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
