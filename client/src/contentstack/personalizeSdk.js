import Personalize from "@contentstack/personalize-edge-sdk";

const projectUid = import.meta.env.VITE_CS_PERSONALIZE_PROJECT_UID;
// console.log("Personalize project UID:", projectUid);

export let personalizeSdk = null;

export const personalizeReady = (async () => {
  if (!projectUid) {
    console.warn(
      "Personalize init skipped: VITE_CS_PERSONALIZE_PROJECT_UID is missing",
    );
    return null;
  }

  try {
    personalizeSdk = await Personalize.init(projectUid);
    return personalizeSdk;
  } catch (error) {
    console.error("Personalize init failed", error);
    personalizeSdk = null;
    return null;
  }
})();

export const getVariantHeaders = async () => {
  await personalizeReady;

  const variants = personalizeSdk?.getVariantAliases?.() || [];

  if (!variants.length) return {};

  return {
    "x-cs-variant-uid": variants.join(","),
  };
};

export const trackPersonalizeEvent = async (eventName) => {
  if (typeof eventName !== "string" || !eventName.trim()) {
    console.warn(
      "Personalize event skipped: eventName must be a non-empty string",
    );
    return null;
  }

  const normalizedEventName = eventName.trim();

  const sdk = await personalizeReady;
  if (!sdk) {
    console.warn("Personalize event skipped: SDK not initialized");
    return null;
  }
  const variantAliases = sdk.getVariantAliases?.() || [];

  if (variantAliases.length === 0) {
    console.warn("Personalize event skipped: No active variants for this user");
    return null;
  }

  try {
    await sdk.triggerImpressions({ aliases: variantAliases });
    const triggered = await sdk.triggerEvent(normalizedEventName);
	// console.log("Personalize event triggered:", triggered);
    return null;
  } catch (error) {
    console.error("Personalize event tracking failed", {
      eventName: normalizedEventName,
      error,
    });
    return null;
  }
};
