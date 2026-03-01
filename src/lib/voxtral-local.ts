// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { VoxtralProcessor, env } from '@huggingface/transformers'

// Always fetch from HuggingFace Hub, never look for local files
env.allowLocalModels = false

const MODEL_ID = 'onnx-community/Voxtral-Mini-3B-2507-ONNX'

export type LocalModelStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface LoadProgress {
  status: LocalModelStatus
  progress: number // 0–100
  message: string
}

// Use `any` for the model to avoid fighting internal-only type requirements
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _processor: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _model: any = null
let _loadPromise: Promise<void> | null = null

/** Resample a WebM/any audio blob to a 16 kHz mono Float32Array */
async function decodeAudioTo16kHz(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer()
  const audioCtx = new AudioContext()
  const decoded = await audioCtx.decodeAudioData(arrayBuffer)
  audioCtx.close()

  const targetRate = 16_000
  if (decoded.sampleRate === targetRate) {
    return decoded.getChannelData(0)
  }

  const length = Math.round(decoded.length * targetRate / decoded.sampleRate)
  const offlineCtx = new OfflineAudioContext(1, length, targetRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = decoded
  source.connect(offlineCtx.destination)
  source.start(0)
  const rendered = await offlineCtx.startRendering()
  return rendered.getChannelData(0)
}

/**
 * Load the Voxtral Mini (3B) model from HuggingFace Hub (cached after first download).
 * Safe to call multiple times — subsequent calls return the same promise.
 */
export function loadVoxtralLocal(onProgress?: (info: LoadProgress) => void): Promise<void> {
  if (_processor && _model) {
    onProgress?.({ status: 'ready', progress: 100, message: 'Model ready' })
    return Promise.resolve()
  }

  if (_loadPromise) return _loadPromise

  _loadPromise = (async () => {
    const report = (progress: number, message: string) =>
      onProgress?.({ status: 'loading', progress, message })

    report(0, 'Loading processor…')
    _processor = await VoxtralProcessor.from_pretrained(MODEL_ID)

    report(5, 'Downloading model weights (this may take several minutes on first run)…')

    // Dynamically import to avoid top-level type issues with the model class
    const { VoxtralForConditionalGeneration } = await import('@huggingface/transformers')

    let lastPct = 5
    _model = await VoxtralForConditionalGeneration.from_pretrained(MODEL_ID, {
      dtype: {
        embed_tokens: 'fp16',
        audio_encoder: 'q4',
        decoder_model_merged: 'q4',
      },
      device: 'webgpu',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: (p: any) => {
        if (typeof p.progress === 'number') {
          const scaled = 5 + (p.progress / 100) * 93
          if (scaled > lastPct) {
            lastPct = scaled
            const file = p.file ? ` (${p.file})` : ''
            report(scaled, `Downloading${file} — ${Math.round(p.progress)}%`)
          }
        }
      },
    })

    onProgress?.({ status: 'ready', progress: 100, message: 'Voxtral Mini ready' })
  })().catch(err => {
    _loadPromise = null // allow retry on next call
    onProgress?.({ status: 'error', progress: 0, message: String(err) })
    throw err
  })

  return _loadPromise
}

export function isModelLoaded(): boolean {
  return _processor !== null && _model !== null
}

/**
 * Transcribe an audio Blob locally using the Voxtral Mini (3B) ONNX model.
 * The model must be loaded first via `loadVoxtralLocal()`.
 */
export async function transcribeWithVoxtralLocal(audioBlob: Blob): Promise<string> {
  if (!_processor || !_model) {
    throw new Error('Model not loaded — call loadVoxtralLocal() first.')
  }

  const audio = await decodeAudioTo16kHz(audioBlob)

  // Multimodal conversation format (runtime supports array content despite TS types)
  const conversation = [
    {
      role: 'user',
      content: [
        { type: 'audio' },
        { type: 'text', text: 'lang:en [TRANSCRIBE]' },
      ],
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = _processor.apply_chat_template(conversation as any, { tokenize: false })
  const inputs = await _processor(text, audio)

  const generated_ids = await _model.generate({
    ...inputs,
    max_new_tokens: 256,
  })

  // Strip prompt tokens — keep only newly generated tokens
  const promptLen = inputs.input_ids?.dims?.at(-1) ?? 0
  const new_tokens = (generated_ids as { slice: (...args: unknown[]) => unknown })
    .slice(null, [promptLen, null])
  const [transcription] = _processor.batch_decode(new_tokens, { skip_special_tokens: true })
  return transcription.trim()
}
