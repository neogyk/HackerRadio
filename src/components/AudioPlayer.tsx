'use client'

import { useState, useEffect, useRef } from 'react'
import { VOICES } from '@/lib/voices'
import type { AiVendor } from '@/lib/ai-summarize'

interface AudioPlayerProps {
  isPlaying: boolean
  currentPostIndex: number
  totalPosts: number
  rate: number
  voiceName: string
  elapsedSeconds: number
  voxtralApiKey: string
  aiVendor: AiVendor
  openaiApiKey: string
  geminiApiKey: string
  onRateChange: (rate: number) => void
  onVoiceChange: (voice: string) => void
  onVoxtralApiKeyChange: (key: string) => void
  onAiVendorChange: (vendor: AiVendor) => void
  onOpenaiApiKeyChange: (key: string) => void
  onGeminiApiKeyChange: (key: string) => void
  onPlayAll: () => void
  onStop: () => void
  onNext: () => void
  onPrev: () => void
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const BAR_COUNT = 40

const VENDORS: { id: AiVendor; label: string; placeholder: string }[] = [
  { id: 'mistral', label: 'Mistral', placeholder: 'Mistral API key…' },
  { id: 'openai',  label: 'OpenAI',  placeholder: 'sk-…' },
  { id: 'gemini',  label: 'Gemini',  placeholder: 'AIza…' },
]

export function AudioPlayer({
  isPlaying,
  currentPostIndex,
  totalPosts,
  rate,
  voiceName,
  elapsedSeconds,
  voxtralApiKey,
  aiVendor,
  openaiApiKey,
  geminiApiKey,
  onRateChange,
  onVoiceChange,
  onVoxtralApiKeyChange,
  onAiVendorChange,
  onOpenaiApiKeyChange,
  onGeminiApiKeyChange,
  onPlayAll,
  onStop,
  onNext,
  onPrev,
}: AudioPlayerProps) {
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => Math.random() * 0.6 + 0.2)
  )
  const [showAiPanel, setShowAiPanel] = useState(false)
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!isPlaying) return
    let lastUpdate = 0
    const animate = (time: number) => {
      if (time - lastUpdate > 120) {
        lastUpdate = time
        setBarHeights(prev =>
          prev.map((h) => {
            const delta = (Math.random() - 0.5) * 0.3
            return Math.max(0.1, Math.min(1, h + delta))
          })
        )
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isPlaying])

  const currentKey = aiVendor === 'mistral' ? voxtralApiKey : aiVendor === 'openai' ? openaiApiKey : geminiApiKey
  const hasKey = !!currentKey

  function handleKeyChange(val: string) {
    if (aiVendor === 'mistral') onVoxtralApiKeyChange(val)
    else if (aiVendor === 'openai') onOpenaiApiKeyChange(val)
    else onGeminiApiKeyChange(val)
  }

  const anyKeySet = !!(voxtralApiKey || openaiApiKey || geminiApiKey)

  return (
    <div className="rounded-2xl border border-orange-400/40 bg-white shadow-lg p-4">
      <div className="flex items-center gap-4">
        {/* Transport controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onPrev}
            disabled={!isPlaying || currentPostIndex <= 0}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          <button
            onClick={isPlaying ? onStop : onPlayAll}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/25'
                : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25'
            }`}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!isPlaying || currentPostIndex >= totalPosts - 1}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Waveform visualization */}
        <div className="flex-1 flex items-end h-16 gap-[3px] px-2">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-100"
              style={{
                height: `${(isPlaying ? h : 0.15) * 100}%`,
                backgroundColor: isPlaying ? '#f97316' : '#d1d5db',
                opacity: isPlaying ? 0.6 + h * 0.4 : 0.6,
              }}
            />
          ))}
        </div>

        {/* Timestamp */}
        <div className="shrink-0 px-3 py-1.5 rounded-lg border border-orange-400/40 bg-orange-50">
          <span className="text-orange-600 font-mono text-lg font-semibold">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Settings row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs text-gray-400 whitespace-nowrap">Speed</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={e => onRateChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500"
          />
          <span className="text-xs text-gray-400 font-mono w-8">{rate.toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs text-gray-400 whitespace-nowrap">Voice</label>
          <select
            value={voiceName}
            onChange={e => onVoiceChange(e.target.value)}
            className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 cursor-pointer"
          >
            {VOICES.map(v => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI vendor toggle button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiPanel(v => !v)}
            title="AI summarization settings"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              anyKeySet
                ? 'border-purple-400/50 text-purple-600 bg-purple-50'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            AI
            {anyKeySet && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />}
          </button>
        </div>

        {isPlaying && (
          <p className="text-xs text-gray-400 shrink-0">
            Story <span className="text-orange-500 font-semibold">{currentPostIndex + 1}</span> / {totalPosts}
          </p>
        )}
      </div>

      {/* AI settings panel */}
      {showAiPanel && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          {/* Vendor tabs */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-2 whitespace-nowrap">Summarize with</span>
            {VENDORS.map(v => (
              <button
                key={v.id}
                onClick={() => onAiVendorChange(v.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  aiVendor === v.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* API key input for selected vendor */}
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={currentKey}
              onChange={e => handleKeyChange(e.target.value)}
              placeholder={VENDORS.find(v => v.id === aiVendor)?.placeholder}
              className="flex-1 bg-gray-50 border border-purple-300/60 rounded-lg px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-purple-400"
            />
            {hasKey && (
              <span className="text-xs text-purple-600 whitespace-nowrap flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Ready
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {aiVendor === 'mistral' && 'Mistral key is also used for Voxtral mic transcription. '}
            API keys are stored in your browser only.
          </p>
        </div>
      )}
    </div>
  )
}
