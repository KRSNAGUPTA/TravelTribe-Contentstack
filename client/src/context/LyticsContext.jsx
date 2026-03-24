import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import { getLyticsProfile } from "@/Lytics/config";

export const LyticsContext = createContext();

export const LyticsProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use useCallback so it's stable for the useEffect
  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLyticsProfile();
      setProfile(data);
      return data;
    } catch (e) {
      console.error("Lytics Provider Error:", e);
      setError(e);
      const fallback = { user: { viewed_hostel: [] } };
      setProfile(fallback);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const injectLyticsScript = () => {
    // 1. Prevent multiple injections
    if (document.getElementById("lytics-js-tag")) return;

    const scriptEl = document.createElement("script");
    scriptEl.id = "lytics-js-tag";
    scriptEl.type = "text/javascript";
    
    // The minified Lytics loader
    scriptEl.innerHTML = `
      !(function () {
        "use strict";
        var o = window.jstag || (window.jstag = {}), r = [];
        function n(e) { o[e] = function () { for (var n = arguments.length, t = new Array(n), i = 0; i < n; i++) t[i] = arguments[i]; r.push([e, t]); }; }
        n("send"), n("mock"), n("identify"), n("pageView"), n("unblock"), n("getid"), n("setid"), n("loadEntity"), n("getEntity"), n("on"), n("once"), n("call");
        o.loadScript = function (n, t, i) {
          var e = document.createElement("script");
          e.async = !0; e.src = n; e.onload = t; e.onerror = i;
          var o = document.getElementsByTagName("script")[0], r = (o && o.parentNode) || document.head || document.body, c = o || r.lastChild;
          return (null != c ? r.insertBefore(e, c) : r.appendChild(e), this);
        };
        o.init = function n(t) {
          this.config = t;
          this.loadScript(t.src, function () {
            if (o.init === n) throw new Error("Load error!");
            o.init(o.config);
            for (var n = 0; n < r.length; n++) { var t = r[n][0], i = r[n][1]; o[t].apply(o, i); }
            r = void 0;
          });
          return this;
        };
      })();
      jstag.init({ src: "https://c.lytics.io/api/tag/6a03218477b4c778f5bda02df0347688/latest.min.js" });
      jstag.pageView();
    `;
    
    document.head.appendChild(scriptEl);
    // console.log("Lytics script injected");
  };

  useEffect(() => {
    let mounted = true;

    // 1. Start the script injection immediately
    injectLyticsScript();

    // 2. Poll for jstag readiness before fetching profile
    // This prevents "ReferenceError: jstag is not defined"
    let checkCount = 0;
    const maxChecks = 20; // 2 seconds total (100ms * 20)

    const pollForLytics = () => {
      if (!mounted) return;

      // Check if window.jstag and the specific 'call' method exist
      if (window.jstag && typeof window.jstag.call === "function") {
        refreshProfile();
      } else if (checkCount < maxChecks) {
        checkCount++;
        setTimeout(pollForLytics, 100);
      } else {
        // Fallback if it never loads (e.g. AdBlock)
        console.warn("Lytics initialization timed out. Using fallback profile.");
        setProfile({ user: { viewed_hostel: [] } });
        setIsLoading(false);
      }
    };

    pollForLytics();

    return () => {
      mounted = false;
    };
  }, [refreshProfile]);

  const contextValue = useMemo(
    () => ({
      profile,
      isLoading,
      error,
      refreshProfile,
    }),
    [profile, isLoading, error, refreshProfile],
  );

  return (
    <LyticsContext.Provider value={contextValue}>
      {children}
    </LyticsContext.Provider>
  );
};