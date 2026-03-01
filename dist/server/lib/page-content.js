// Built: 2026-03-01T15:46:44.716Z
//#region \0virtual:/Users/leonid/Desktop/LinkedinRadio/src/lib/page-content.ts
const MAX_CHARS = 8e3;
const PROXIES = [(url) => `https://corsproxy.io/?${encodeURIComponent(url)}`, (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`];
/**
* Fetch a web page and extract its readable text content.
* Tries multiple CORS proxies in order until one succeeds.
*/
async function fetchPageText(url) {
	for (const makeProxy of PROXIES) try {
		const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(1e4) });
		if (!res.ok) continue;
		const text = extractText(await res.text()).slice(0, MAX_CHARS);
		if (text.length > 100) return text;
	} catch {}
	return "";
}
function extractText(html) {
	const doc = new DOMParser().parseFromString(html, "text/html");
	doc.querySelectorAll("script, style, nav, header, footer, aside, iframe, noscript, svg, [role=\"navigation\"], [role=\"banner\"], [aria-hidden=\"true\"]").forEach((el) => el.remove());
	return ((doc.querySelector("article") || doc.querySelector("main") || doc.querySelector("[role=\"main\"]") || doc.body)?.textContent || "").replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
/**
* For HN self-posts (Ask HN, Show HN), strip HTML tags from the text field.
*/
function stripHtml(html) {
	return (new DOMParser().parseFromString(html, "text/html").body.textContent || "").trim();
}

//#endregion
export { fetchPageText, stripHtml };