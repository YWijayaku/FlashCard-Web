import { useRef } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useObjectUrl } from '@/hooks/useObjectUrl'

interface ImageInputProps {
  label: string
  value: Blob | undefined
  onFile: (file: File) => void
  onClear: () => void
}

/** Tombol pilih/hapus gambar + pratinjau. */
export function ImageInput({ label, value, onFile, onClear }: ImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const url = useObjectUrl(value)

  return (
    <div className="space-y-2">
      {url && <img src={url} alt={`Gambar ${label}`} className="max-h-48 max-w-full rounded-md border object-contain" />}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-label={`Pilih gambar ${label}`}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ''
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <ImagePlus aria-hidden />
          {value ? 'Ganti gambar' : 'Tambah gambar'}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <Trash2 aria-hidden />
            Hapus gambar
          </Button>
        )}
      </div>
    </div>
  )
}
