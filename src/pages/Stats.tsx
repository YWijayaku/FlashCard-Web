import { useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/PageHeader'
import { Heatmap } from '@/features/stats/Heatmap'
import { ReviewsChart } from '@/features/stats/ReviewsChart'
import {
  activityByDay,
  addLocalDays,
  currentStreak,
  formatDuration,
  heatmapWeeks,
  lastDays,
  reviewSummary,
  startOfLocalWeek,
  statusCounts,
  studyTimeMs,
} from '@/features/stats/stats'
import { db } from '@/lib/db'
import { startOfLocalDay } from '@/lib/queue'
import type { CardState } from '@/types'

function Tile({ value, label, hint }: { value: string | number; label: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default function StatsPage() {
  const [deckId, setDeckId] = useState('')
  const decks = useLiveQuery(() => db.decks.orderBy('name').toArray(), [])
  const data = useLiveQuery(async () => {
    const [logs, sessions, cardIds, states] = await Promise.all([
      deckId ? db.reviewLogs.where('deckId').equals(deckId).toArray() : db.reviewLogs.toArray(),
      deckId ? db.sessions.where('deckId').equals(deckId).toArray() : db.sessions.toArray(),
      (deckId ? db.cards.where('deckId').equals(deckId).primaryKeys() : db.cards.toCollection().primaryKeys()) as Promise<string[]>,
      db.cardStates.toArray(),
    ])
    return { logs, sessions, cardIds, states: new Map<string, CardState>(states.map((s) => [s.cardId, s])) }
  }, [deckId])

  const stats = useMemo(() => {
    if (!data) return undefined
    const now = Date.now()
    const today = startOfLocalDay(now)
    const tomorrow = addLocalDays(now, 1)
    const week = startOfLocalWeek(now)
    const activity = activityByDay(data.logs, data.sessions)
    return {
      timeToday: studyTimeMs(data.logs, data.sessions, today, tomorrow),
      timeWeek: studyTimeMs(data.logs, data.sessions, week, tomorrow),
      today: reviewSummary(data.logs, today, tomorrow),
      week: reviewSummary(data.logs, week, tomorrow),
      status: statusCounts(data.cardIds, data.states),
      streak: currentStreak(activity, now),
      days: lastDays(activity, now, 14),
      heat: heatmapWeeks(activity, now),
    }
  }, [data])

  const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

  return (
    <>
      <PageHeader
        title="Statistik"
        actions={
          <select
            aria-label="Filter deck"
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className="h-11 max-w-[60vw] rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
          >
            <option value="">Semua deck</option>
            {decks?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        }
      />
      {stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile value={`🔥 ${stats.streak}`} label="Hari berturut-turut" />
            <Tile value={formatDuration(stats.timeToday)} label="Belajar hari ini" hint={`Minggu ini: ${formatDuration(stats.timeWeek)}`} />
            <Tile value={stats.today.count} label="Review hari ini" hint={`Minggu ini: ${stats.week.count}`} />
            <Tile value={pct(stats.today.accuracy)} label="Akurasi hari ini" hint={`Minggu ini: ${pct(stats.week.accuracy)}`} />
          </div>
          <Panel title="Status kartu">
            <div className="grid grid-cols-3 gap-3">
              <Tile value={stats.status.fresh} label="Baru" />
              <Tile value={stats.status.learning} label="Belajar" />
              <Tile value={stats.status.known} label="Hafal" />
            </div>
          </Panel>
          <Panel title="Review 14 hari terakhir">
            <ReviewsChart days={stats.days} />
          </Panel>
          <Panel title="Aktivitas 12 minggu">
            <Heatmap weeks={stats.heat} />
          </Panel>
        </div>
      )}
    </>
  )
}
