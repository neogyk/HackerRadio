'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { fetchStories, type HNStory, type FeedType } from '@/lib/hn-api'
import { speak as piperSpeak, stopSpeaking, warmUpEngine } from '@/lib/piper-tts'
import { fetchPageText, stripHtml } from '@/lib/page-content'
import { summarizeForAudio, type AiVendor } from '@/lib/ai-summarize'
import { VOICES } from '@/lib/voices'
import { HNPostCard } from './HNPostCard'
import { AudioPlayer } from './AudioPlayer'
import { ChatPanel } from './ChatPanel'

function ls(key: string) {
  return typeof window !== 'undefined' ? (localStorage.getItem(key) ?? '') : ''
}

export function HNPostFeed() {
  const [stories, setStories] = useState<HNStory[]>([])
  const [loading, setLoading] = useState(true)
  const [feedType, setFeedType] = useState<FeedType>('top')
  const [currentPostIndex, setCurrentPostIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [rate, setRate] = useState(1.0)
  const [voiceName, setVoiceName] = useState(VOICES[0].id)
  const [notes, setNotes] = useState<string[]>([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // API keys per vendor
  const [voxtralApiKey, setVoxtralApiKey] = useState<string>(() => ls('voxtral_api_key'))
  const [openaiApiKey, setOpenaiApiKey]   = useState<string>(() => ls('openai_api_key'))
  const [geminiApiKey, setGeminiApiKey]   = useState<string>(() => ls('gemini_api_key'))
  const [aiVendor, setAiVendor]           = useState<AiVendor>(() => (ls('ai_vendor') as AiVendor) || 'mistral')

  const autoAdvanceRef = useRef(true)
  const storiesRef = useRef<HNStory[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playSessionRef = useRef(0)

  // Refs to always have current values in async callbacks
  const voiceRef = useRef(voiceName)
  useEffect(() => { voiceRef.current = voiceName }, [voiceName])

  const voxtralApiKeyRef = useRef(voxtralApiKey)
  useEffect(() => { voxtralApiKeyRef.current = voxtralApiKey }, [voxtralApiKey])

  const openaiApiKeyRef = useRef(openaiApiKey)
  useEffect(() => { openaiApiKeyRef.current = openaiApiKey }, [openaiApiKey])

  const geminiApiKeyRef = useRef(geminiApiKey)
  useEffect(() => { geminiApiKeyRef.current = geminiApiKey }, [geminiApiKey])

  const aiVendorRef = useRef(aiVendor)
  useEffect(() => { aiVendorRef.current = aiVendor }, [aiVendor])

  // Pre-warm Piper engine so first play is instant
  useEffect(() => { warmUpEngine() }, [])

  // Keep refs in sync
  useEffect(() => { storiesRef.current = stories }, [stories])

  // Elapsed time counter
  useEffect(() => {
    if (isPlaying) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying])

  // Fetch stories from HN API
  useEffect(() => {
    setLoading(true)
    stopSpeaking()
    setIsPlaying(false)
    setCurrentPostIndex(-1)

    fetchStories(feedType, 30)
      .then(data => {
        setStories(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [feedType])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    piperSpeak(text, voiceRef.current, onEnd).catch(() => { onEnd?.() })
  }, [])

  const playPost = useCallback(async (index: number, autoAdvance = true) => {
    const list = storiesRef.current
    if (index < 0 || index >= list.length) {
      setIsPlaying(false)
      setCurrentPostIndex(-1)
      return
    }

    autoAdvanceRef.current = autoAdvance
    setCurrentPostIndex(index)
    setIsPlaying(true)

    const session = ++playSessionRef.current
    const cancelled = () => playSessionRef.current !== session

    const story = list[index]
    const intro = `${story.title}. Posted by ${story.by} with ${story.score} points and ${story.descendants} comments.`

    // Kick off body fetch + summarize in the background immediately
    const bodyPromise: Promise<string> = (async () => {
      const vendor = aiVendorRef.current
      const apiKey = vendor === 'mistral' ? voxtralApiKeyRef.current
                   : vendor === 'openai'  ? openaiApiKeyRef.current
                   :                        geminiApiKeyRef.current
      if (!apiKey) return ''

      setIsSummarizing(true)
      try {
        let bodyText = ''
        if (story.text) {
          bodyText = stripHtml(story.text)
        } else if (story.url) {
          console.log('[Feed] Fetching page:', story.url)
          bodyText = await fetchPageText(story.url)
          console.log('[Feed] Fetched', bodyText.length, 'chars')
        }
        if (!bodyText) return ''

        console.log(`[Feed] Summarizing with ${vendor}...`)
        const summary = await summarizeForAudio(story.title, bodyText, vendor, apiKey)
        console.log('[Feed] Summary:', summary)
        return summary
      } catch (err) {
        console.warn('[Feed] Summarize failed:', err)
        return ''
      } finally {
        setIsSummarizing(false)
      }
    })()

    // Play intro immediately — no waiting for fetch/summarize
    await new Promise<void>(resolve => speak(intro, resolve))
    if (cancelled()) return

    // Now await the body (likely already done while intro was playing)
    const bodyText = await bodyPromise
    if (cancelled()) return

    if (bodyText) {
      console.log('[Feed] Speaking summary...')
      await new Promise<void>(resolve => speak(bodyText, resolve))
      if (cancelled()) return
    } else {
      console.log('[Feed] No summary (no API key, fetch failed, or no URL)')
    }

    // Auto-advance
    if (autoAdvanceRef.current && index < list.length - 1) {
      playPost(index + 1, true)
    } else {
      setIsPlaying(false)
      setCurrentPostIndex(-1)
    }
  }, [speak])

  const stopPlaying = useCallback(() => {
    stopSpeaking()
    playSessionRef.current++
    autoAdvanceRef.current = false
    setIsPlaying(false)
    setCurrentPostIndex(-1)
  }, [])

  const playAll = useCallback(() => { playPost(0, true) }, [playPost])

  const playNext = useCallback(() => {
    if (currentPostIndex < storiesRef.current.length - 1) {
      playPost(currentPostIndex + 1, true)
    }
  }, [currentPostIndex, playPost])

  const playPrev = useCallback(() => {
    if (currentPostIndex > 0) {
      playPost(currentPostIndex - 1, true)
    }
  }, [currentPostIndex, playPost])

  // Cleanup on unmount
  useEffect(() => { return () => { stopSpeaking() } }, [])

  // Re-speak when voice changes during playback
  useEffect(() => {
    if (isPlaying && currentPostIndex >= 0) {
      playPost(currentPostIndex, autoAdvanceRef.current)
    }
  }, [voiceName]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist API keys and vendor selection
  const handleVoxtralApiKeyChange = (key: string) => {
    setVoxtralApiKey(key)
    localStorage.setItem('voxtral_api_key', key)
  }
  const handleOpenaiApiKeyChange = (key: string) => {
    setOpenaiApiKey(key)
    localStorage.setItem('openai_api_key', key)
  }
  const handleGeminiApiKeyChange = (key: string) => {
    setGeminiApiKey(key)
    localStorage.setItem('gemini_api_key', key)
  }
  const handleAiVendorChange = (vendor: AiVendor) => {
    setAiVendor(vendor)
    localStorage.setItem('ai_vendor', vendor)
  }

  const handleSendChat = useCallback((message: string) => { speak(message) }, [speak])

  const handleToNotes = useCallback(() => {
    if (currentPostIndex >= 0 && currentPostIndex < storiesRef.current.length) {
      const story = storiesRef.current[currentPostIndex]
      setNotes(prev => [...prev, `${story.title} — ${story.score} pts by ${story.by}`])
    }
  }, [currentPostIndex])

  const feedTypes: { value: FeedType; label: string }[] = [
    { value: 'top', label: 'Top' },
    { value: 'new', label: 'New' },
    { value: 'best', label: 'Best' },
  ]

  const vendorLabel = aiVendor === 'mistral' ? 'Mistral' : aiVendor === 'openai' ? 'OpenAI' : 'Gemini'

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-5rem)]">
      {/* Top section: Chat + Notes side by side */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Chat panel */}
        <div className="w-[45%] shrink-0">
          <ChatPanel onSend={handleSendChat} onToNotes={handleToNotes} voxtralApiKey={voxtralApiKey} />
        </div>

        {/* Right: Notes panel */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Feed type selector */}
          <div className="flex gap-2">
            {feedTypes.map(ft => (
              <button
                key={ft.value}
                onClick={() => setFeedType(ft.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  feedType === ft.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {ft.label}
              </button>
            ))}
          </div>

          {/* Notes / Stories area */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            {notes.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Notes</h4>
                {notes.map((note, i) => (
                  <p key={i} className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">{note}</p>
                ))}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 rounded-xl bg-gray-100 animate-pulse">
                    <div className="h-3 w-3/4 bg-gray-200 rounded mb-2" />
                    <div className="h-2 w-1/4 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              stories.map((story, index) => (
                <HNPostCard
                  key={story.id}
                  story={story}
                  isPlaying={isPlaying}
                  isCurrentPost={currentPostIndex === index}
                  onPlay={() => playPost(index, false)}
                  onStop={stopPlaying}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summarizing indicator */}
      {isSummarizing && (
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-600 self-start">
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Fetching &amp; summarizing with {vendorLabel}…
        </div>
      )}

      {/* Bottom: Audio player with waveform */}
      <AudioPlayer
        isPlaying={isPlaying}
        currentPostIndex={currentPostIndex}
        totalPosts={stories.length}
        rate={rate}
        voiceName={voiceName}
        elapsedSeconds={elapsedSeconds}
        voxtralApiKey={voxtralApiKey}
        aiVendor={aiVendor}
        openaiApiKey={openaiApiKey}
        geminiApiKey={geminiApiKey}
        onRateChange={setRate}
        onVoiceChange={setVoiceName}
        onVoxtralApiKeyChange={handleVoxtralApiKeyChange}
        onAiVendorChange={handleAiVendorChange}
        onOpenaiApiKeyChange={handleOpenaiApiKeyChange}
        onGeminiApiKeyChange={handleGeminiApiKeyChange}
        onPlayAll={playAll}
        onStop={stopPlaying}
        onNext={playNext}
        onPrev={playPrev}
      />
    </div>
  )
}
