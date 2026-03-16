import Personalize from "@contentstack/personalize-edge-sdk";

const projectUid = import.meta.env.VITE_CS_PERSONALIZE_PROJECT_UID;
console.log("Personalize project UID:", projectUid);

export let personalizeSdk = null;

export const personalizeReady = (async () => {
  if (!projectUid) {
    console.warn(
      "Personalize init skipped: VITE_CS_PERSONALIZE_PROJECT_UID is missing"
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