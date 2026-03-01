// Built: 2026-03-01T18:55:24.970Z
import { VoxtralProcessor, env } from "@huggingface/transformers";

//#region \0virtual:/Users/leonid/Desktop/LinkedinRadio/src/lib/voxtral-local.ts
env.allowLocalModels = false;
const MODEL_ID = "onnx-community/Voxtral-Mini-3B-2507-ONNX";
let _processor = null;
let _model = null;
let _loadPromise = null;
/** Resample a WebM/any audio blob to a 16 kHz mono Float32Array */
async function decodeAudioTo16kHz(blob) {
	const arrayBuffer = await blob.arrayBuffer();
	const audioCtx = new AudioContext();
	const decoded = await audioCtx.decodeAudioData(arrayBuffer);
	audioCtx.close();
	const targetRate = 16e3;
	if (decoded.sampleRate === targetRate) return decoded.getChannelData(0);
	const length = Math.round(decoded.length * targetRate / decoded.sampleRate);
	const offlineCtx = new OfflineAudioContext(1, length, targetRate);
	const source = offlineCtx.createBufferSource();
	source.buffer = decoded;
	source.connect(offlineCtx.destination);
	source.start(0);
	return (await offlineCtx.startRendering()).getChannelData(0);
}
/**
* Load the Voxtral Mini (3B) model from HuggingFace Hub (cached after first download).
* Safe to call multiple times — subsequent calls return the same promise.
*/
function loadVoxtralLocal(onProgress) {
	if (_processor && _model) {
		onProgress?.({
			status: "ready",
			progress: 100,
			message: "Model ready"
		});
		return Promise.resolve();
	}
	if (_loadPromise) return _loadPromise;
	_loadPromise = (async () => {
		const report = (progress, message) => onProgress?.({
			status: "loading",
			progress,
			message
		});
		report(0, "Loading processor…");
		_processor = await VoxtralProcessor.from_pretrained(MODEL_ID);
		report(5, "Downloading model weights (this may take several minutes on first run)…");
		const { VoxtralForConditionalGeneration } = await import("@huggingface/transformers");
		let lastPct = 5;
		_model = await VoxtralForConditionalGeneration.from_pretrained(MODEL_ID, {
			dtype: {
				embed_tokens: "fp16",
				audio_encoder: "q4",
				decoder_model_merged: "q4"
			},
			device: "webgpu",
			progress_callback: (p) => {
				if (typeof p.progress === "number") {
					const scaled = 5 + p.progress / 100 * 93;
					if (scaled > lastPct) {
						lastPct = scaled;
						report(scaled, `Downloading${p.file ? ` (${p.file})` : ""} — ${Math.round(p.progress)}%`);
					}
				}
			}
		});
		onProgress?.({
			status: "ready",
			progress: 100,
			message: "Voxtral Mini ready"
		});
	})().catch((err) => {
		_loadPromise = null;
		onProgress?.({
			status: "error",
			progress: 0,
			message: String(err)
		});
		throw err;
	});
	return _loadPromise;
}
function isModelLoaded() {
	return _processor !== null && _model !== null;
}
/**
* Transcribe an audio Blob locally using the Voxtral Mini (3B) ONNX model.
* The model must be loaded first via `loadVoxtralLocal()`.
*/
async function transcribeWithVoxtralLocal(audioBlob) {
	if (!_processor || !_model) throw new Error("Model not loaded — call loadVoxtralLocal() first.");
	const audio = await decodeAudioTo16kHz(audioBlob);
	const text = _processor.apply_chat_template([{
		role: "user",
		content: [{ type: "audio" }, {
			type: "text",
			text: "lang:en [TRANSCRIBE]"
		}]
	}], { tokenize: false });
	const inputs = await _processor(text, audio);
	const generated_ids = await _model.generate({
		...inputs,
		max_new_tokens: 256
	});
	const promptLen = inputs.input_ids?.dims?.at(-1) ?? 0;
	const new_tokens = generated_ids.slice(null, [promptLen, null]);
	const [transcription] = _processor.batch_decode(new_tokens, { skip_special_tokens: true });
	return transcription.trim();
}

//#endregion
export { isModelLoaded, loadVoxtralLocal, transcribeWithVoxtralLocal };