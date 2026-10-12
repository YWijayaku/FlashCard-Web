import { useObjectUrl } from '@/hooks/useObjectUrl'
import { CLOZE_MASK, parseCloze } from '@/lib/cloze'
import { cardTextSizeClass } from '@/lib/text'
import { cn } from '@/lib/utils'

interface CardSideProps {
  text: string
  image?: Blob
  /** Untuk teks cloze: `masked` = tampilkan [...], `revealed` = buka semua. */
  cloze?: 'masked' | 'revealed'
  className?: string
}

/** Menampilkan isi satu sisi kartu (teks + gambar), ukuran teks menyesuaikan panjangnya. */
export function CardSide({ text, image, cloze, className }: CardSideProps) {
  const url = useObjectUrl(image)
  const segments = cloze ? parseCloze(text) : [{ type: 'text' as const, value: text }]
  const plainLength = segments.reduce(
    (n, s) => n + (s.type === 'cloze' && cloze === 'masked' ? CLOZE_MASK.length : s.value.length),
    0,
  )

  return (
    <div className={cn('flex w-full flex-col items-center gap-3 text-center', className)}>
      {url && <img src={url} alt="" className="max-h-[40dvh] max-w-full rounded-md object-contain" />}
      {text && (
        <p className={cn('whitespace-pre-wrap break-words font-medium', cardTextSizeClass(plainLength))}>
          {segments.map((s, i) =>
            s.type === 'text' ? (
              <span key={i}>{s.value}</span>
            ) : cloze === 'masked' ? (
              <span key={i} className="rounded bg-muted px-1 text-primary">
                {CLOZE_MASK}
              </span>
            ) : (
              <mark key={i} className="rounded bg-primary/15 px-1 text-primary">
                {s.value}
              </mark>
            ),
          )}
        </p>
      )}
    </div>
  )
}
