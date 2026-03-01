'use client'

interface NotesPanelProps {
  notes: string[]
}

export function NotesPanel({ notes }: NotesPanelProps) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-700 bg-gray-900 p-5 overflow-y-auto">
      {notes.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No notes yet. Use "To Notes" to save content here.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note, i) => (
            <div key={i} className="border-b border-gray-800 pb-2">
              <p className="text-gray-300 text-sm leading-relaxed">{note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
