// Built: 2026-02-16T12:31:04.612Z
//#region src/lib/voices.ts
const VOICES = [
	{
		id: "en_US-libritts_r-medium",
		label: "LibriTTS (US)"
	},
	{
		id: "en_US-amy-medium",
		label: "Amy (US)"
	},
	{
		id: "en_US-danny-low",
		label: "Danny (US)"
	},
	{
		id: "en_US-ryan-medium",
		label: "Ryan (US)"
	},
	{
		id: "en_GB-alan-medium",
		label: "Alan (GB)"
	},
	{
		id: "en_GB-alba-medium",
		label: "Alba (GB)"
	}
];

//#endregion
//#region \0virtual:/Users/leonid/Desktop/LinkedinRadio/src/lib/piper-tts.ts
let engine = null;
async function getEngine() {
	if (!engine) {
		const { PiperWebEngine } = await import("piper-tts-web");
		engine = new PiperWebEngine();
	}
	return engine;
}
let currentAudio = null;
function stopSpeaking() {
	if (currentAudio) {
		currentAudio.pause();
		currentAudio.src = "";
		currentAudio = null;
	}
}
async function speak(text, voiceId, onEnd) {
	stopSpeaking();
	const result = await (await getEngine()).generate(text, voiceId, 0);
	const url = URL.createObjectURL(result.file);
	const audio = new Audio(url);
	currentAudio = audio;
	audio.onended = () => {
		URL.revokeObjectURL(url);
		currentAudio = null;
		onEnd?.();
	};
	audio.onerror = () => {
		URL.revokeObjectURL(url);
		currentAudio = null;
		onEnd?.();
	};
	await audio.play();
}
function isSpeaking() {
	return currentAudio !== null && !currentAudio.paused;
}

//#endregion
export { VOICES, isSpeaking, speak, stopSpeaking };