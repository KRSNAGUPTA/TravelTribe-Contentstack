import { addEditableTags } from "@contentstack/utils";
import Stack from "./contentstackSDK";
import cmsClient from "./contentstackClient";

export const getEntryByUrl = async (contentTypeUid, locale, entryUrl) => {
  try {
    const result = Stack.ContentType(contentTypeUid)
      .Query()
      .language(locale)
      .where("url", `${entryUrl}`)
      .toJSON()
      .find();

    addEditableTags(result[0][0], contentTypeUid, true, locale);
    const data = result[0][0];
    return data;
  } catch (error) {
    throw error;
  }
};

export const setDataForChromeExtension = (data) => {
  // console.log("data", data)
  if (!data.entryUid || !data.contenttype || !data.locale) {
    console.error("Util.js:  Incomplete data for chrome extension");
    console.error("Received data:", data);
    return;
  }
  try {
    document.body.setAttribute("data-pageref", data.entryUid);
    document.body.setAttribute("data-contenttype", data.contenttype);
    document.body.setAttribute("data-locale", data.locale);
    // console.log("done")
  } catch (error) {
    console.error(
      "util.js:  Error while setting data for chrome extension",
      error,
    );
  }
};

export const fetchEntries = async (contentType, viaSdk, ref) => {
  if (!contentType || !viaSdk) {
    console.error("fetchEntries: Missing required parameters");
    return [];
  }
  if (viaSdk === "true") {
    try {
      let entryQuery = Stack.ContentType(contentType).Query();

      if (ref) {
        entryQuery = entryQuery.includeReference(ref);
      }
      const [entries] = await entryQuery.toJSON().find();
      addEditableTags(
        entries,
        contentType,
        true,
        import.meta.env.VITE_CS_LOCALE,
      );
      return entries;
    } catch (error) {
      console.error("Error fetching entries via SDK", error);
      return [];
    }
  } else {
    try {
      const response = await cmsClient.get(
        `/content_types/${contentType}/entries?environment=${import.meta.env.VITE_CS_DEV_ENV}`,
        {
          params: ref ? { include: [ref] } : {},
        },
      );
      return response.data.entries || [];
    } catch (error) {
      console.error("Error fetching entries via CDA", error);
      return [];
    }
  }
};

export const fetchEntryById = async (contentType, entryId, viaSdk, ref) => {
  if (!contentType || !entryId || !viaSdk) {
    console.error("fetchEntryById: Missing required parameters");
    return null;
  }
  if (viaSdk === "true") {
    try {
      const contentTypeRef = Stack.ContentType(contentType);
      let entryQuery = contentTypeRef.Entry(entryId);

      if (ref) {
        entryQuery = entryQuery.includeReference(ref);
      }

      const entry = await entryQuery.toJSON().fetch();

      addEditableTags(entry, contentType, true, import.meta.env.VITE_CS_LOCALE);

      return entry;
    } catch (error) {
      console.error("Error fetching entry by ID via SDK", error);
      return null;
    }
  } else {
    try {
      const response = await cmsClient.get(
        `/content_types/${contentType}/entries/${entryId}?environment=${import.meta.env.VITE_CS_DEV_ENV}`,
        {
          params: ref ? { include: [ref] } : {},
        },
      );

      return response.data.entry ?? null;
    } catch (error) {
      console.error("Error fetching entry by ID via CDA", error);
      return null;
    }
  }
};

// console.log(getEntryByUrl("landing_page","en-us",""))
