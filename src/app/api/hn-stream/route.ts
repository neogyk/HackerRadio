import { NextRequest } from 'next/server'

const HN_BASE = 'https://hacker-news.firebaseio.com/v0'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'top'
  const count = Math.min(parseInt(req.nextUrl.searchParams.get('count') ?? '30', 10), 100)

  const endpoint =
    type === 'new' ? 'newstories' : type === 'best' ? 'beststories' : 'topstories'

  let ids: number[]
  try {
    const res = await fetch(`${HN_BASE}/${endpoint}.json`)
    ids = await res.json()
  } catch {
    return new Response('Failed to fetch story IDs', { status: 502 })
  }

  const batch = ids.slice(0, count)
  const enc = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

      // Send ordered IDs first so the client knows the rank order
      send({ type: 'ids', ids: batch })

      // Fetch all stories in parallel; stream each as it resolves
      await Promise.all(
        batch.map(async (id) => {
          try {
            const res = await fetch(`${HN_BASE}/item/${id}.json`)
            const item = await res.json()
            if (!item || item.type !== 'story' || item.dead || item.deleted) return

            send({
              type: 'story',
              story: {
                id: item.id,
                title: item.title ?? '',
                url: item.url,
                score: item.score ?? 0,
                by: item.by ?? 'unknown',
                time: item.time ?? 0,
                descendants: item.descendants ?? 0,
                text: item.text,
                type: item.type,
              },
            })
          } catch {
            // skip failed items
          }
        }),
      )

      send({ type: 'done' })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
