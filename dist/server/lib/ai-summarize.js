// Built: 2026-03-01T17:06:21.243Z
//#region \0virtual:/Users/leonid/Desktop/LinkedinRadio/src/lib/ai-summarize.ts
const geminiRateLimiter = {
	timestamps: [],
	async wait() {
		const now = Date.now();
		this.timestamps = this.timestamps.filter((t) => now - t < 120 * 1e3);
		if (this.timestamps.length >= 3) {
			const waitMs = this.timestamps[0] + 120 * 1e3 - now;
			await new Promise((r) => setTimeout(r, waitMs));
			this.timestamps = this.timestamps.filter((t) => Date.now() - t < 120 * 1e3);
		} else if (this.timestamps.length > 0) await new Promise((r) => setTimeout(r, 5e3));
		this.timestamps.push(Date.now());
	}
};
const SYSTEM_PROMPT = "You summarize articles for audio playback. Write 2–4 natural spoken sentences. No bullet points, no markdown, no special characters. Clean up any HTML artifacts or boilerplate.";
async function summarizeForAudio(title, body, vendor, apiKey) {
	switch (vendor) {
		case "mistral": return summarizeOpenAICompat(title, body, apiKey, "https://api.mistral.ai/v1/chat/completions", "mistral-small-latest");
		case "openai": return summarizeOpenAICompat(title, body, apiKey, "https://api.openai.com/v1/chat/completions", "gpt-4o-mini");
		case "gemini": return summarizeGemini(title, body, apiKey);
	}
}
async function summarizeOpenAICompat(title, body, apiKey, url, model) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			model,
			messages: [{
				role: "system",
				content: SYSTEM_PROMPT
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
		throw new Error(`${model} error ${response.status}: ${err}`);
	}
	return ((await response.json()).choices?.[0]?.message?.content ?? "").trim();
}
async function summarizeGemini(title, body, apiKey) {
	await geminiRateLimiter.wait();
	const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nTitle: ${title}\n\n${body}` }] }],
			generationConfig: {
				maxOutputTokens: 350,
				temperature: .4
			}
		})
	});
	if (!response.ok) {
		const err = await response.text().catch(() => response.statusText);
		throw new Error(`Gemini error ${response.status}: ${err}`);
	}
	return ((await response.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
}

//#endregion
export { summarizeForAudio };