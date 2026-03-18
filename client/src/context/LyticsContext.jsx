import { createContext, useEffect, useMemo, useState } from "react";
import { getLyticsProfile } from "@/Lytics/config";

export const LyticsContext = createContext();

export const LyticsProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
    [profile, isLoading, error],
  );

  return (
    <LyticsContext.Provider value={contextValue}>{children}</LyticsContext.Provider>
  );
};
