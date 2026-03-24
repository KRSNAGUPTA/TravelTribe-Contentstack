/**
 * Safe wrapper for jstag.send (Events)
 * Uses window prefix to prevent ReferenceErrors if Lytics is blocked or slow.
 */
export const trackEvent = (eventName, properties = {}) => {
  const lib = window.jstag;

  if (!lib || typeof lib.send !== "function") {
    console.warn(`Lytics not loaded. Skipping event: ${eventName}`);
    return false;
  }
  
  try {
    lib.send({
      _e: eventName,
      ...properties,
    });
    return true;
  } catch (error) {
    console.error("Lytics trackEvent failed:", error);
    return false;
  }
};

/**
 * Safe wrapper for jstag.identify (Identity) - NOT CURRENTLY USED
 * No official docs found on this method, Right now all thing are managed via jstag.send 
 */
// export const identifyUser = (email, traits = {}) => {
//   const lib = window.jstag;

//   if (!lib || typeof lib.identify !== "function") {
//     console.warn("Lytics not loaded. Skipping identify.");
//     return;
//   }

//   try {
//     lib.identify({
//       email: email,
//       ...traits,
//     });
//   } catch (error) {
//     console.error("Lytics identify failed:", error);
//   }
// };

/**
 * Promise wrapper for jstag.call("entityReady") (Profiles)
 * Resolves with profile data or a safe fallback if blocked/timed out.
 */
export const getLyticsProfile = () => {
  return new Promise((resolve) => {
    // 1. Set a safety timeout so the app doesn't wait forever if blocked
    const timeout = setTimeout(() => {
      console.warn("Lytics profile fetch timed out (likely AdBlock).");
      resolve({ user: { viewed_hostel: [] } }); 
    }, 2500);

    try {
      const lib = window.jstag;

      // 2. Check if lib exists and the 'call' method is ready
      if (!lib || typeof lib.call !== "function") {
        clearTimeout(timeout);
        resolve({ user: { viewed_hostel: [] } });
        return;
      }

      // 3. Request the profile via the Lytics 'entityReady' callback
      lib.call("entityReady", (profile) => {
        clearTimeout(timeout);
        
        if (profile && profile.data) {
          resolve(profile.data);
        } else {
          resolve({ user: { viewed_hostel: [] } });
        }
      });
    } catch (e) {
      clearTimeout(timeout);
      console.error("Lytics getLyticsProfile crashed:", e);
      resolve({ user: { viewed_hostel: [] } });
    }
  });
};