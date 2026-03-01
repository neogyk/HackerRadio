/**
 * Voxtral Mini 4B Realtime — Mistral audio transcription API
 * https://docs.mistral.ai/capabilities/audio/
 */

export const VOXTRAL_MODEL = 'voxtral-mini-latest'
export const VOXTRAL_API_URL = 'https://api.mistral.ai/v1/audio/transcriptions'

export async function transcribeWithVoxtral(
  audioBlob: Blob,
  apiKey: string,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('model', VOXTRAL_MODEL)

  const response = await fetch(VOXTRAL_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`Voxtral API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return (data.text ?? '').trim()
}
