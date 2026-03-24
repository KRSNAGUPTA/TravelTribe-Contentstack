import { createContext, useEffect, useMemo, useState } from "react";


export const LyticsContext = createContext();

export const LyticsProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getLyticsProfile = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.jstag) {
        resolve({ user: { viewed_hostel: [] } });
        return;
      }

      const timeout = setTimeout(() => {
        console.warn(
          "Lytics timed out (likely blocked by AdBlock). Please, turn off Adblocker for personalized experience!",
        );
        resolve({ user: { viewed_hostel: [] } }); // Resolve with empty data so the app doesn't crash
      }, 2000); // 2 seconds is usually enough

      // console.log("Calling jstag for entityReady");

      // 2. Try the Lytics call
      try {
        window.jstag.call("entityReady", (profileData) => {
          clearTimeout(timeout); // Cancel the timeout if Lytics actually responds
          // console.log("Lytics responded successfully");

          if (profileData && profileData.data) {
            resolve(profileData.data);
          } else {
            resolve({ user: { viewed_hostel: [] } }); // Fallback
          }
        });
      } catch (e) {
        clearTimeout(timeout);
        console.error("jstag is not defined or crashed:", e);
        resolve({ user: { viewed_hostel: [] } });
      }
    });
  };

  const refreshProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLyticsProfile();
      setProfile(data);
      return data;
    } catch (e) {
      setError(e);
      setProfile({ user: { viewed_hostel: [] } });
      return { user: { viewed_hostel: [] } };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) refreshProfile();

    return () => {
      mounted = false;
    };
  }, []);
    
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