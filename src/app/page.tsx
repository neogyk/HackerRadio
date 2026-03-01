const quivert = { fontFamily: "'Quivert', sans-serif" }

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20" style={quivert}>
      <div className="text-center space-y-8">
        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            Audio-first Hacker News
          </div>
          <h1 className="text-5xl md:text-7xl tracking-tight">
            <span className="text-gray-900">Listen to</span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Hacker News
            </span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Turn top HN stories into a podcast-like experience.
            Listen hands-free while commuting, exercising, or cooking.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <a
            href="/feed"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold text-lg transition-all shadow-lg shadow-orange-500/25 no-underline"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Listening
          </a>
          <p className="text-sm text-gray-400">
            No login required — streams live from the HN API
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Stories</h3>
            <p className="text-gray-500 text-sm">
              Stream top, new, and best stories directly from Hacker News
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Radio Mode</h3>
            <p className="text-gray-500 text-sm">
              Auto-play through stories like a podcast with adjustable speed
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Text to Speech</h3>
            <p className="text-gray-500 text-sm">
              Listen to story summaries read aloud with natural voices
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
