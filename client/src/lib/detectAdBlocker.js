const AD_BAIT_CLASS = "adsbox ads ad-banner ad-placement";
const BAIT_STYLE =
	"position:absolute;left:-9999px;top:-9999px;height:1px;width:1px;pointer-events:none;";
const PROBE_URLS = [
	// "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
	// "https://c.lytics.io/static/pathfora.min.js",
	// "https://c.lytics.io/static/io.min.js",
];

const checkBaitElementBlocked = () => {
	const bait = document.createElement("div");
	bait.className = AD_BAIT_CLASS;
	bait.style.cssText = BAIT_STYLE;
	document.body.appendChild(bait);

	const blocked =
		bait.offsetParent === null ||
		bait.offsetHeight === 0 ||
		bait.offsetWidth === 0 ||
		window.getComputedStyle(bait).display === "none";

	bait.remove();
	return blocked;
};

const checkBlockedScript = (url, timeoutMs) =>
	new Promise((resolve) => {
		const script = document.createElement("script");
		script.async = true;
		script.src = url;

		const done = (value) => {
			script.onload = null;
			script.onerror = null;
			script.remove();
			resolve(value);
		};

		const timer = setTimeout(() => done(true), timeoutMs);
		script.onload = () => {
			clearTimeout(timer);
			done(false);
		};
		script.onerror = () => {
			clearTimeout(timer);
			done(true);
		};

		document.head.appendChild(script);
	});

const checkBlockedRequest = async (url, timeoutMs) => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		// no-cors keeps this lightweight and usable for third-party resources.
		await fetch(url, {
			method: "GET",
			mode: "no-cors",
			cache: "no-store",
			signal: controller.signal,
		});
		return false;
	} catch {
		return true;
	} finally {
		clearTimeout(timer);
	}
};

export const detectAdBlocker = async ({ timeoutMs = 1500 } = {}) => {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return false;
	}

	const baitBlocked = checkBaitElementBlocked();
	const scriptChecks = await Promise.all(
		PROBE_URLS.map((url) => checkBlockedScript(url, timeoutMs)),
	);
	const requestChecks = await Promise.all(
		PROBE_URLS.map((url) => checkBlockedRequest(url, timeoutMs)),
	);
	const scriptBlocked = scriptChecks.some(Boolean);
	const requestBlocked = requestChecks.some(Boolean);
	const blocked = baitBlocked || scriptBlocked || requestBlocked;

	// if (blocked) {
	// 	console.warn("Ad blocker detected: ad/tracker resources appear blocked.", {
	// 		baitBlocked,
	// 		scriptChecks,
	// 		requestChecks,
	// 	});
	// } else {
	// 	console.info("No ad blocker detected.");
	// }

	return blocked;
};

export default detectAdBlocker;
