export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8 p-4 rounded-2xl bg-white border border-gray-200 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-2 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-6 rounded-2xl bg-white border border-gray-200 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 w-28 bg-gray-200 rounded" />
                <div className="h-2 w-40 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-200 rounded" />
              <div className="h-3 w-3/4 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
