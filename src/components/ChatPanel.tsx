'use client'

import { useState, useRef } from 'react'
import { transcribeWithVoxtral } from '@/lib/voxtral'
import {
  loadVoxtralLocal,
  transcribeWithVoxtralLocal,
  isModelLoaded,
  type LoadProgress,
} from '@/lib/voxtral-local'

type MicMode = 'api' | 'local'

function lsGet(key: string) {
  return typeof window !== 'undefined' ? (localStorage.getItem(key) ?? '') : ''
}
function lsSet(key: string, val: string) {
  if (typeof window !== 'undefined') localStorage.setItem(key, val)
}

interface ChatPanelProps {
  onSend: (message: string) => void
  onToNotes: () => void
  voxtralApiKey: string
}

export function ChatPanel({ onSend, onToNotes, voxtralApiKey }: ChatPanelProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)
  const [micMode, setMicMode] = useState<MicMode>(
    () => (lsGet('mic_mode') as MicMode) || 'api',
  )
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleMicMode = () => {
    const next: MicMode = micMode === 'api' ? 'local' : 'api'
    setMicMode(next)
    lsSet('mic_mode', next)
    setRecordError(null)
    setLoadProgress(null)
  }

  const startRecording = async () => {
    setRecordError(null)

    if (micMode === 'api' && !voxtralApiKey) {
      setRecordError('No Mistral API key — set it in the player settings below.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })

        setIsTranscribing(true)
        try {
          let text: string
          if (micMode === 'local') {
            // Load model on first use (shows download progress)
            if (!isModelLoaded()) {
              await loadVoxtralLocal(setLoadProgress)
            }
            setLoadProgress(null)
            text = await transcribeWithVoxtralLocal(audioBlob)
          } else {
            text = await transcribeWithVoxtral(audioBlob, voxtralApiKey)
          }
          if (text) setMessage(prev => (prev ? `${prev} ${text}` : text))
        } catch (err) {
          setRecordError(err instanceof Error ? err.message : 'Transcription failed')
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      setRecordError('Microphone access denied.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
  }

  const toggleRecording = () => {
    if (isRecording) stopRecording()
    else startRecording()
  }

  const isLocalReady = micMode === 'local'
  const canRecord = isLocalReady || !!voxtralApiKey

  return (
    <div className="flex flex-col h-full rounded-2xl border border-blue-300/60 bg-white p-4 shadow-sm">
      <h3 className="text-orange-500 font-semibold text-lg mb-3">Chat:</h3>

      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message or use the mic to transcribe…"
        className="flex-1 bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:border-blue-400 placeholder-gray-400"
      />

      {/* Model download progress */}
      {loadProgress && loadProgress.status === 'loading' && (
        <div className="mt-2 space-y-1">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${loadProgress.progress}%` }}
            />
          </div>
          <p className="text-xs text-purple-600 truncate">{loadProgress.message}</p>
        </div>
      )}

      {recordError && (
        <p className="text-xs text-red-500 mt-2">{recordError}</p>
      )}

      <div className="flex items-center justify-between mt-3 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onToNotes}
            className="px-4 py-2 rounded-lg border border-blue-400/60 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer"
          >
            To Notes
          </button>

          {/* API / Local toggle */}
          <button
            onClick={toggleMicMode}
            title={micMode === 'api' ? 'Switch to local Voxtral Mini (3B) via transformers.js' : 'Switch to Mistral API transcription'}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              micMode === 'local'
                ? 'border-emerald-400/60 bg-emerald-50 text-emerald-700'
                : 'border-gray-300 text-gray-500 hover:border-gray-400'
            }`}
          >
            {micMode === 'local' ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
                Local
              </>
            ) : (
              'API'
            )}
          </button>

          {/* Mic button */}
          <button
            onClick={toggleRecording}
            disabled={isTranscribing || (!canRecord && micMode === 'api')}
            title={
              micMode === 'api' && !voxtralApiKey
                ? 'Set Mistral API key in player settings'
                : isRecording
                ? 'Stop recording'
                : micMode === 'local'
                ? 'Record with Voxtral Mini (3B) — local, no key needed'
                : 'Record with Voxtral Mini (API)'
            }
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isRecording
                ? 'border-red-400/60 bg-red-50 text-red-500 animate-pulse'
                : isTranscribing
                ? 'border-purple-400/50 bg-purple-50 text-purple-600'
                : micMode === 'local'
                ? 'border-emerald-400/60 text-emerald-700 hover:bg-emerald-50'
                : voxtralApiKey
                ? 'border-purple-400/50 text-purple-600 hover:bg-purple-50'
                : 'border-gray-300 text-gray-400 hover:border-gray-400'
            }`}
          >
            {isTranscribing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="px-4 py-2 rounded-lg border border-blue-400/60 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>

      {micMode === 'local' && (
        <p className="text-xs text-gray-400 mt-2">
          Voxtral Mini (3B) runs locally via transformers.js — no API key needed. Model is downloaded once and cached.
        </p>
      )}
    </div>
  )
}
