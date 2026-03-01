declare module 'piper-tts-web' {
  interface GenerateResult {
    phonemeData: unknown
    file: Blob
    duration: number
  }

  export class PiperWebEngine {
    constructor(options?: Record<string, unknown>)
    destroy(): void
    generate(text: string, voice: string, speaker?: number): Promise<GenerateResult>
  }
}
