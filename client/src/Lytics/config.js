// client/src/Lytics/config.js

const initLytics = async () => {
  if (!import.meta.env.VITE_LYTICS_CID || !import.meta.env.VITE_LYTICS_STREAM) {
    console.warn(
      "Lytics CID or Stream is not set. Skipping Lytics initialization.",
    );
    return;
  }
  try {
    jstag.init({
      cid: import.meta.env.VITE_LYTICS_CID, // Connects to your Lytics account
      // stream: import.meta.env.VITE_LYTICS_STREAM, // Target data stream
      pageView: true, // Enable/Disable auto page tracking
      sessecs: 1800, // Session timeout (seconds)
    });
  } catch (error) {
    console.error("Error initializing Lytics:", error);
  }
};

initLytics();

export const trackPage = (pageName) => {
  if (window.jstag) {
    window.jstag.page({
      name: pageName,
    });
  }
  console.log(`Tracked page: ${pageName}`);
};

export const trackEvent = (eventName, properties = {}) => {
  jstag.send({
    _e: eventName,
    ...properties,
    stream:"test stream"
  });
};

export const identifyUser = (userId, traits = {}) => {
  jstag.identify(userId, traits);
}