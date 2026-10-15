import { addEditableTags } from "@contentstack/utils";
import Stack from "./contentstackSDK";

export const getEntryByUrl = async (contentTypeUid, locale, entryUrl) => {
  const result = await Stack
    .ContentType(contentTypeUid)
    .Query()
    .language(locale)
    .where("url", `${entryUrl}`)
    .toJSON()
    .find();

  const entry = result?.[0]?.[0];
  if (entry) addEditableTags(entry, contentTypeUid, true, locale);
  return entry;
};

export const fetchEntries = async (contentType, ref) => {
  if (!contentType) {
    console.error("fetchEntries: contentType is required");
    return [];
  }

  try {
    let query = Stack.ContentType(contentType).Query();
    if (ref) query = query.includeReference(ref);

    const [entries] = await query.toJSON().find();

    entries.forEach((entry) =>
      addEditableTags(entry, contentType, true, import.meta.env.VITE_CS_LOCALE)
    );

    return entries;
  } catch (error) {
    console.error(`Error fetching entries for "${contentType}":`, error);
    return [];
  }
};

export const fetchEntryById = async (contentType, entryId, ref) => {
  if (!contentType || !entryId) {
    console.error("fetchEntryById: contentType and entryId are required");
    return null;
  }

  try {
    let entry = Stack.ContentType(contentType).Entry(entryId);
    if (ref) entry = entry.includeReference(ref);

    const data = await entry.toJSON().fetch();

    addEditableTags(data, contentType, true, import.meta.env.VITE_CS_LOCALE);
    return data;
  } catch (error) {
    console.error(
      `Error fetching entry "${entryId}" of "${contentType}":`,
      error
    );
    return null;
  }
};