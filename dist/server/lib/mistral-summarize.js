// Built: 2026-03-01T18:55:24.770Z
//#region \0virtual:/Users/leonid/Desktop/LinkedinRadio/src/lib/mistral-summarize.ts
/**
* Summarize article text for audio playback using Mistral chat completions.
*/
async function summarizeForAudio(title, body, apiKey) {
	const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			model: "mistral-small-latest",
			messages: [{
				role: "system",
				content: "You summarize articles for audio playback. Write 2–4 natural spoken sentences. No bullet points, no markdown, no special characters. Clean up any HTML artifacts or boilerplate."
			}, {
				role: "user",
				content: `Title: ${title}\n\n${body}`
			}],
			max_tokens: 350,
			temperature: .4
		})
	});
	if (!response.ok) {
		const err = await response.text().catch(() => response.statusText);
		throw new Error(`Mistral summarize error ${response.status}: ${err}`);
	}
	return ((await response.json()).choices?.[0]?.message?.content ?? "").trim();
}

//#endregion
export { summarizeForAudio };