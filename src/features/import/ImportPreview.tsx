import { cn } from '@/lib/utils'
import type { ImportRow } from './parse'

/** Tabel preview; baris dengan error ditandai merah beserta alasannya. */
export function ImportPreview({ rows }: { rows: ImportRow[] }) {
  const errors = rows.filter((r) => r.errors.length > 0).length
  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="font-semibold">{rows.length - errors}</span> kartu siap diimpor
        {errors > 0 && (
          <>
            {' · '}
            <span className="font-semibold text-destructive">{errors} baris error</span> (dilewati)
          </>
        )}
      </p>
      <ul className="max-h-[50dvh] divide-y overflow-y-auto rounded-lg border" aria-label="Preview kartu">
        {rows.map((r) => (
          <li key={r.line} className={cn('flex gap-3 p-3 text-sm', r.errors.length > 0 && 'bg-destructive/10')}>
            <span className="w-8 shrink-0 text-xs text-muted-foreground">#{r.line}</span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="break-words font-medium">{r.front || <em className="text-muted-foreground">(kosong)</em>}</div>
              <div className="break-words text-muted-foreground">{r.back || '—'}</div>
              {r.third && <div className="break-words text-xs text-muted-foreground">{r.third}</div>}
              {r.errors.map((e) => (
                <div key={e} className="text-xs font-medium text-destructive">
                  ⚠ {e}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
