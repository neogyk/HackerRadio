// @huggingface/transformers loaded from CDN at runtime (same approach as voxtral-local.ts)
const HF_CDN = 'https://esm.sh/@huggingface/transformers@3.8.1'

const MODEL_ID = 'onnx-community/text_summarization-ONNX'

export type OnnxLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface OnnxLoadProgress {
  status: OnnxLoadStatus
  progress: number // 0–100
  message: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _lib: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pipe: any = null
let _loadPromise: Promise<void> | null = null

async function getLib() {
  if (_lib) return _lib
  // @vite-ignore
  _lib = await import(/* @vite-ignore */ HF_CDN)
  _lib.env.allowLocalModels = false
  return _lib
}

/**
 * Lazy-load the ONNX summarization pipeline from HuggingFace Hub.
 * Safe to call multiple times — returns the same promise while in-flight.
 */
export function loadOnnxSummarizer(onProgress?: (info: OnnxLoadProgress) => void): Promise<void> {
  if (_pipe) {
    onProgress?.({ status: 'ready', progress: 100, message: 'ONNX summarizer ready' })
    return Promise.resolve()
  }

  if (_loadPromise) return _loadPromise

  _loadPromise = (async () => {
    const report = (progress: number, message: string) =>
      onProgress?.({ status: 'loading', progress, message })

    report(0, 'Loading transformers.js from CDN…')
    const { pipeline, env } = await getLib()
    env.allowLocalModels = false

    report(5, 'Downloading ONNX summarization model (first run may take a moment)…')

    let lastPct = 5
    _pipe = await pipeline('summarization', MODEL_ID, {
      device: 'wasm',
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

    onProgress?.({ status: 'ready', progress: 100, message: 'ONNX summarizer ready' })
  })().catch(err => {
    _loadPromise = null
    onProgress?.({ status: 'error', progress: 0, message: String(err) })
    throw err
  })

  return _loadPromise
}

export function isOnnxSummarizerLoaded(): boolean {
  return _pipe !== null
}

/**
 * Summarize article text locally using the ONNX model.
 * Call loadOnnxSummarizer() first (or let summarizeForAudio auto-load it).
 */
export async function summarizeWithOnnx(title: string, body: string): Promise<string> {
  if (!_pipe) {
    // Auto-load on first call
    await loadOnnxSummarizer()
  }

  // T5/BART expects plain text; trim to a reasonable token budget (~1 024 chars)
  const input = `${title}. ${body}`.slice(0, 1_024)

  const [result] = await _pipe(input, {
    max_new_tokens: 120,
    min_new_tokens: 20,
    no_repeat_ngram_size: 3,
  })

  return (result?.summary_text ?? '').trim()
}
