export interface PiperVoice {
  id: string
  label: string
}

export const VOICES: PiperVoice[] = [
  { id: 'en_US-libritts_r-medium', label: 'LibriTTS' },
  { id: 'browser', label: 'Voxtral' },
]
