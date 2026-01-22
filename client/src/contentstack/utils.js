import { addEditableTags } from "@contentstack/utils"

export const getEntryByUrl = async (contentTypeUid, locale, entryUrl) => {
    try {
        const result = Stack.ContentType(contentTypeUid)
            .Query()
            .language(locale)
            .where('url', `${entryUrl}`)
            .toJSON()
            .find()

        addEditableTags(result[0][0], contentTypeUid, true, locale)
        const data = result[0][0]
        return data

    } catch (error) {
        throw error
    }
}

export const setDataForChromeExtension = (data) => {
    // console.log("data", data)
    if(!data.entryUid || !data.contenttype || !data.locale){
        console.error("Util.js:  Incomplete data for chrome extension")
        return;
    }
    try {
        document.body.setAttribute('data-pageref', data.entryUid)
        document.body.setAttribute('data-contenttype', data.contenttype)
        document.body.setAttribute('data-locale', data.locale)
        // console.log("done")
    } catch (error) {
        console.error("util.js:  Error while setting data for chrome extension", error)
    }
}


// console.log(getEntryByUrl("landing_page","en-us",""))