export type AiVendor = 'mistral' | 'openai' | 'gemini'

// Gemini rate limiter: max 3 requests per 2 minutes, 5s sleep between calls
const geminiRateLimiter = {
  timestamps: [] as number[],
  async wait() {
    const now = Date.now()
    // Remove timestamps older than 2 minutes
    this.timestamps = this.timestamps.filter(t => now - t < 2 * 60 * 1000)
    if (this.timestamps.length >= 3) {
      // Wait until the oldest request falls outside the 2-minute window
      const waitMs = this.timestamps[0] + 2 * 60 * 1000 - now
      await new Promise(r => setTimeout(r, waitMs))
      this.timestamps = this.timestamps.filter(t => Date.now() - t < 2 * 60 * 1000)
    } else if (this.timestamps.length > 0) {
      // 5s sleep between calls
      await new Promise(r => setTimeout(r, 5000))
    }
    this.timestamps.push(Date.now())
  },
}

const SYSTEM_PROMPT =
  'You summarize articles for audio playback. Write 2–4 natural spoken sentences. No bullet points, no markdown, no special characters. Clean up any HTML artifacts or boilerplate.'

export async function summarizeForAudio(
  title: string,
  body: string,
  vendor: AiVendor,
  apiKey: string,
): Promise<string> {
  switch (vendor) {
    case 'mistral':
      return summarizeOpenAICompat(title, body, apiKey, 'https://api.mistral.ai/v1/chat/completions', 'mistral-small-latest')
    case 'openai':
      return summarizeOpenAICompat(title, body, apiKey, 'https://api.openai.com/v1/chat/completions', 'gpt-4o-mini')
    case 'gemini':
      return summarizeGemini(title, body, apiKey)
  }
}

async function summarizeOpenAICompat(
  title: string,
  body: string,
  apiKey: string,
  url: string,
  model: string,
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Title: ${title}\n\n${body}` },
      ],
      max_tokens: 350,
      temperature: 0.4,
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText)
    throw new Error(`${model} error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return (data.choices?.[0]?.message?.content ?? '').trim()
}

async function summarizeGemini(title: string, body: string, apiKey: string): Promise<string> {
  await geminiRateLimiter.wait()
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nTitle: ${title}\n\n${body}` }] }],
        generationConfig: { maxOutputTokens: 350, temperature: 0.4 },
      }),
    },
  )

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText)
    throw new Error(`Gemini error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
}
