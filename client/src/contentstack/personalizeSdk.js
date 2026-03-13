import Personalize from "@contentstack/personalize-edge-sdk";

const projectUid = import.meta.env.VITE_CS_PERSONALIZE_PROJECT_UID;

export let personalizeSdk = null;

const initPersonalizeSdk = async () => {
  if (!projectUid) {
    console.warn("Personalize init skipped: VITE_CS_PERSONALIZE_PROJECT_UID is missing");
    return;
  }

  try {
    personalizeSdk = await Personalize.init(projectUid);
  } catch (error) {
    console.error("Personalize init failed", error);
    personalizeSdk = null;
  }
};

void initPersonalizeSdk();

export const getVariantHeaders = () => {
  const variants = personalizeSdk?.getVariantAliases?.() || [];
  const variantAliasHeader = variants.join(",");

  if (!variantAliasHeader) {
    return {};
  }

  return {
    "x-cs-variant-uid": variantAliasHeader,
  };
};
