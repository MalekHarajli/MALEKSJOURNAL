import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useObjectUrl } from './useObjectUrl'

interface Props {
  label: string
  hint: string
  blob: Blob | undefined
  onChange: (blob: Blob | undefined) => void
}

export default function ShotSlot({ label, hint, blob, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const url = useObjectUrl(blob)

  const acceptFile = (file: File | undefined | null) => {
    if (file && file.type.startsWith('image/')) onChange(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">{label}</span>
        {blob && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="inline-flex items-center gap-1 text-[11px] text-mist/60 transition-colors hover:text-loss"
          >
            <X size={11} /> Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          acceptFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {url ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`block w-full overflow-hidden rounded-xl border transition-colors ${
            dragOver ? 'border-glow' : 'border-edge hover:border-edge-lit'
          }`}
          title="Click to replace"
        >
          <img src={url} alt={`${label} screenshot`} className="aspect-video w-full object-cover" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed
            text-mist/60 transition-colors hover:text-mist ${
              dragOver ? 'border-glow bg-glow/10 text-glow-soft' : 'border-edge bg-raise/50 hover:border-edge-lit'
            }`}
        >
          <ImagePlus size={20} />
          <span className="text-xs">{hint}</span>
        </button>
      )}
    </div>
  )
}
