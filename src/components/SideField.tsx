import { useId, useState, type ClipboardEvent, type DragEvent } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { compressImage, firstImageFile } from '@/lib/image'
import { cn } from '@/lib/utils'
import { ImageInput } from './ImageInput'

interface SideFieldProps {
  label: string
  hint?: string
  text: string
  image: Blob | undefined
  required?: boolean
  onTextChange: (text: string) => void
  onImageChange: (image: Blob | undefined) => void
}

/** Satu sisi kartu: teks + gambar (upload, paste, atau drag-drop). */
export function SideField({ label, hint, text, image, required, onTextChange, onImageChange }: SideFieldProps) {
  const id = useId()
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function setFromFile(file: File) {
    setError(undefined)
    setBusy(true)
    try {
      onImageChange(await compressImage(file))
    } catch {
      setError('Gambar tidak dapat diproses.')
    } finally {
      setBusy(false)
    }
  }

  function handlePaste(e: ClipboardEvent) {
    const file = firstImageFile(e.clipboardData)
    if (!file) return
    e.preventDefault()
    void setFromFile(file)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = firstImageFile(e.dataTransfer)
    if (file) void setFromFile(file)
  }

  return (
    <div
      className={cn('space-y-2 rounded-lg border border-dashed p-3 transition-colors', dragging && 'border-primary bg-primary/5')}
      onPaste={handlePaste}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Textarea id={id} value={text} onChange={(e) => onTextChange(e.target.value)} rows={2} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <ImageInput label={label} value={image} onFile={(f) => void setFromFile(f)} onClear={() => onImageChange(undefined)} />
      {busy && <p className="text-xs text-muted-foreground">Mengompres gambar…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Tempel (paste) atau seret gambar ke kotak ini.</p>
    </div>
  )
}
