// Built: 2026-03-01T15:12:15.394Z
//#region \0virtual:/Users/leonid/Desktop/LinkedinRadio/src/lib/hn-api.ts
const HN_BASE = "https://hacker-news.firebaseio.com/v0";
async function fetchStoryIds(type) {
	const endpoint = type === "top" ? "topstories" : type === "new" ? "newstories" : "beststories";
	return (await fetch(`${HN_BASE}/${endpoint}.json`)).json();
}
async function fetchStory(id) {
	const item = await (await fetch(`${HN_BASE}/item/${id}.json`)).json();
	if (!item || item.type !== "story" || item.dead || item.deleted) return null;
	return {
		id: item.id,
		title: item.title ?? "",
		url: item.url,
		score: item.score ?? 0,
		by: item.by ?? "unknown",
		time: item.time ?? 0,
		descendants: item.descendants ?? 0,
		text: item.text,
		type: item.type
	};
}
async function fetchStories(type, count = 30) {
	const batch = (await fetchStoryIds(type)).slice(0, count);
	return (await Promise.all(batch.map(fetchStory))).filter((s) => s !== null);
}

//#endregion
export { fetchStories, fetchStory, fetchStoryIds };