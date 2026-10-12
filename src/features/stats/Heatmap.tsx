import { cn } from '@/lib/utils'
import type { HeatCell } from './stats'

// Satu hue (warna utama), terang → gelap.
const LEVEL_CLASS = ['bg-muted', 'bg-primary/25', 'bg-primary/50', 'bg-primary/75', 'bg-primary']
const DAYS = ['Sen', '', 'Rab', '', 'Jum', '', '']

const label = (c: HeatCell) =>
  `${new Date(c.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}: ${c.count} aktivitas`

/** Heatmap aktivitas 12 minggu (kolom = minggu, baris = Senin–Minggu). */
export function Heatmap({ weeks }: { weeks: HeatCell[][] }) {
  return (
    <figure className="space-y-2">
      <div className="flex gap-1.5">
        <div className="grid grid-rows-7 gap-1 text-[10px] leading-none text-muted-foreground" aria-hidden>
          {DAYS.map((d, i) => (
            <span key={i} className="flex h-full items-center">{d}</span>
          ))}
        </div>
        <div className="grid flex-1 grid-flow-col grid-rows-7 gap-1" role="img" aria-label="Heatmap aktivitas 12 minggu terakhir">
          {weeks.flat().map((c) => (
            <div
              key={c.key}
              title={c.future ? undefined : label(c)}
              className={cn('aspect-square min-w-0 rounded-[3px]', c.future ? 'bg-transparent' : LEVEL_CLASS[c.level])}
            />
          ))}
        </div>
      </div>
      <figcaption className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        Sedikit
        {LEVEL_CLASS.map((cls) => (
          <span key={cls} className={cn('h-3 w-3 rounded-[3px]', cls)} aria-hidden />
        ))}
        Banyak
      </figcaption>
    </figure>
  )
}
