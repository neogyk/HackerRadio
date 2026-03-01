export interface HNStory {
  id: number
  title: string
  url?: string
  score: number
  by: string
  time: number
  descendants: number
  text?: string
  type: string
}

const HN_BASE = 'https://hacker-news.firebaseio.com/v0'

export type FeedType = 'top' | 'new' | 'best'

export async function fetchStoryIds(type: FeedType): Promise<number[]> {
  const endpoint = type === 'top' ? 'topstories' : type === 'new' ? 'newstories' : 'beststories'
  const res = await fetch(`${HN_BASE}/${endpoint}.json`)
  return res.json()
}

export async function fetchStory(id: number): Promise<HNStory | null> {
  const res = await fetch(`${HN_BASE}/item/${id}.json`)
  const item = await res.json()
  if (!item || item.type !== 'story' || item.dead || item.deleted) return null
  return {
    id: item.id,
    title: item.title ?? '',
    url: item.url,
    score: item.score ?? 0,
    by: item.by ?? 'unknown',
    time: item.time ?? 0,
    descendants: item.descendants ?? 0,
    text: item.text,
    type: item.type,
  }
}

export async function fetchStories(type: FeedType, count = 30): Promise<HNStory[]> {
  const ids = await fetchStoryIds(type)
  const batch = ids.slice(0, count)
  const results = await Promise.all(batch.map(fetchStory))
  return results.filter((s): s is HNStory => s !== null)
}
