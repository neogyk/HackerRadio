import type { LayoutProps, Metadata } from 'rari'

export default function RootLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen text-gray-900" style={{ backgroundColor: 'rgb(255, 240, 194)' }}>
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">HN Radio</span>
          </a>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'HN Radio - Listen to Hacker News',
  description: 'Transform your Hacker News feed into an audio experience',
}
