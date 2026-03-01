'use client'

import type { HNStory } from '@/lib/hn-api'

interface HNPostCardProps {
  story: HNStory
  isPlaying: boolean
  isCurrentPost: boolean
  onPlay: () => void
  onStop: () => void
}

function timeAgo(unixSeconds: number): string {
  const seconds = Math.floor(Date.now() / 1000 - unixSeconds)
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function getDomain(url?: string): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}

export function HNPostCard({ story, isPlaying, isCurrentPost, onPlay, onStop }: HNPostCardProps) {
  const domain = getDomain(story.url)

  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        isCurrentPost && isPlaying
          ? 'bg-orange-50 border-orange-300 shadow-sm shadow-orange-100'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">
            {story.url ? (
              <a
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-orange-600 transition-colors no-underline text-gray-900"
              >
                {story.title}
              </a>
            ) : (
              story.title
            )}
          </h3>
          {domain && (
            <span className="text-xs text-gray-400">({domain})</span>
          )}
        </div>

        {/* Play/Stop button */}
        <button
          onClick={isCurrentPost && isPlaying ? onStop : onPlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            isCurrentPost && isPlaying
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
          }`}
          title={isCurrentPost && isPlaying ? 'Stop' : 'Play'}
        >
          {isCurrentPost && isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          {story.score}
        </span>
        <span className="text-xs text-gray-400">by {story.by}</span>
        <a
          href={`https://news.ycombinator.com/item?id=${story.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-orange-600 transition-colors flex items-center gap-1 no-underline"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {story.descendants}
        </a>
        <span className="text-xs text-gray-300">{timeAgo(story.time)}</span>
        {isCurrentPost && isPlaying && (
          <span className="ml-auto text-xs text-orange-500 flex items-center gap-1">
            <span className="flex gap-0.5">
              <span className="w-1 h-3 bg-orange-400 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="w-1 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <span className="w-1 h-5 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.45s' }} />
            </span>
            Playing
          </span>
        )}
      </div>
    </div>
  )
}
