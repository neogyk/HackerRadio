'use client'

export { VOICES, type PiperVoice } from './voices'

let engine: any = null
let piperFailed = false

async function getEngine() {
  if (piperFailed) return null
  if (engine) return engine

  try {
    console.log('[TTS] Loading Piper engine...')
    const { PiperWebEngine } = await import('piper-tts-web')
    engine = new PiperWebEngine()
    console.log('[TTS] Piper engine loaded')
    return engine
  } catch (err) {
    console.warn('[TTS] Piper failed to load, using browser speechSynthesis:', err)
    piperFailed = true
    return null
  }
}

let currentAudio: HTMLAudioElement | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if (currentUtterance) {
    speechSynthesis.cancel()
    currentUtterance = null
  }
}

async function speakWithPiper(
  text: string,
  voiceId: string,
  onEnd?: () => void,
): Promise<boolean> {
  try {
    const eng = await getEngine()
    if (!eng) return false

    const result = await eng.generate(text, voiceId, 0)
    if (!result?.file || result.file.size === 0) return false

    console.log('[TTS] Piper generated', result.file.size, 'bytes')
    const url = URL.createObjectURL(result.file)
    const audio = new Audio(url)
    currentAudio = audio

    audio.onended = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      onEnd?.()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      onEnd?.()
    }

    await audio.play()
    return true
  } catch (err) {
    console.warn('[TTS] Piper speak failed, falling back:', err)
    return false
  }
}

function speakWithBrowser(text: string, onEnd?: () => void) {
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.0
  currentUtterance = utterance

  utterance.onend = () => {
    currentUtterance = null
    onEnd?.()
  }
  utterance.onerror = () => {
    currentUtterance = null
    onEnd?.()
  }

  speechSynthesis.speak(utterance)
  console.log('[TTS] Speaking with browser speechSynthesis')
}

export async function speak(
  text: string,
  voiceId: string,
  onEnd?: () => void,
): Promise<void> {
  stopSpeaking()

  if (voiceId === 'browser') {
    speakWithBrowser(text, onEnd)
    return
  }

  const piperOk = await speakWithPiper(text, voiceId, onEnd)
  if (!piperOk) {
    speakWithBrowser(text, onEnd)
  }
}

/** Call early (e.g. on mount) to pre-load the engine so first play is instant. */
export function warmUpEngine(): void {
  getEngine().catch(() => {})
}

export function isSpeaking(): boolean {
  return (currentAudio !== null && !currentAudio.paused) || speechSynthesis.speaking
}
