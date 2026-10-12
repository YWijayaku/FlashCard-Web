import { localDayKey } from '@/lib/notify'
import { startOfLocalDay } from '@/lib/queue'
import type { CardState, ReviewLog, Session } from '@/types'

/** Batas durasi per review agar kartu yang ditinggal lama tidak menggelembungkan waktu belajar. */
export const MAX_REVIEW_MS = 5 * 60_000
export const MAX_SESSION_MS = 60 * 60_000

export function addLocalDays(ts: number, days: number): number {
  const d = new Date(startOfLocalDay(ts))
  d.setDate(d.getDate() + days)
  return d.getTime()
}

/** Senin pada minggu yang sama (lokal). */
export function startOfLocalWeek(ts: number): number {
  const d = new Date(startOfLocalDay(ts))
  const offset = (d.getDay() + 6) % 7
  return addLocalDays(d.getTime(), -offset)
}

const inRange = (t: number, from: number, to: number) => t >= from && t < to

/** Waktu belajar: durasi review (dibatasi) + durasi sesi Match. */
export function studyTimeMs(logs: readonly ReviewLog[], sessions: readonly Session[], from: number, to: number): number {
  let total = 0
  for (const l of logs) if (inRange(l.reviewedAt, from, to)) total += Math.min(Math.max(0, l.durationMs), MAX_REVIEW_MS)
  for (const s of sessions) {
    if (s.mode === 'match' && s.endedAt !== undefined && inRange(s.startedAt, from, to)) {
      total += Math.min(Math.max(0, s.endedAt - s.startedAt), MAX_SESSION_MS)
    }
  }
  return total
}

export interface ReviewSummary {
  count: number
  correct: number
  /** 0–1; null jika belum ada review. */
  accuracy: number | null
}

export function reviewSummary(logs: readonly ReviewLog[], from: number, to: number): ReviewSummary {
  let count = 0
  let correct = 0
  for (const l of logs) {
    if (!inRange(l.reviewedAt, from, to)) continue
    count++
    if (l.rating >= 3) correct++
  }
  return { count, correct, accuracy: count ? correct / count : null }
}

export interface StatusCounts {
  fresh: number
  learning: number
  known: number
}

/** Baru (New), belajar (Learning/Relearning), hafal (Review). Kartu tanpa state dihitung baru. */
export function statusCounts(cardIds: readonly string[], states: ReadonlyMap<string, CardState>): StatusCounts {
  const out = { fresh: 0, learning: 0, known: 0 }
  for (const id of cardIds) {
    const s = states.get(id)?.state ?? 0
    if (s === 0) out.fresh++
    else if (s === 2) out.known++
    else out.learning++
  }
  return out
}

/** Jumlah aktivitas (review + sesi Match) per hari lokal. */
export function activityByDay(logs: readonly ReviewLog[], sessions: readonly Session[]): Map<string, number> {
  const map = new Map<string, number>()
  const add = (t: number, n: number) => {
    const k = localDayKey(t)
    map.set(k, (map.get(k) ?? 0) + n)
  }
  for (const l of logs) add(l.reviewedAt, 1)
  for (const s of sessions) if (s.mode === 'match' && s.endedAt !== undefined) add(s.startedAt, Math.max(1, s.cardsStudied))
  return map
}

/**
 * Streak hari berturut-turut. Jika hari ini belum ada aktivitas, streak dihitung
 * sampai kemarin (belum putus sampai hari berganti).
 */
export function currentStreak(activity: ReadonlyMap<string, number>, now: number): number {
  let day = startOfLocalDay(now)
  if (!activity.get(localDayKey(day))) day = addLocalDays(day, -1)
  let streak = 0
  while ((activity.get(localDayKey(day)) ?? 0) > 0) {
    streak++
    day = addLocalDays(day, -1)
  }
  return streak
}

export interface DayCount {
  key: string
  date: number
  count: number
}

/** `days` hari terakhir (termasuk hari ini), urut lama → baru. */
export function lastDays(activity: ReadonlyMap<string, number>, now: number, days: number): DayCount[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addLocalDays(now, i - days + 1)
    const key = localDayKey(date)
    return { key, date, count: activity.get(key) ?? 0 }
  })
}

export interface HeatCell extends DayCount {
  /** 0 = kosong, 1–4 = intensitas. */
  level: 0 | 1 | 2 | 3 | 4
  future: boolean
}

export function heatLevel(count: number, max: number): HeatCell['level'] {
  if (count <= 0 || max <= 0) return 0
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as HeatCell['level']
}

/** Heatmap 12 minggu: kolom = minggu (Senin–Minggu), minggu terakhir memuat hari ini. */
export function heatmapWeeks(activity: ReadonlyMap<string, number>, now: number, weeks = 12): HeatCell[][] {
  const today = startOfLocalDay(now)
  const first = addLocalDays(startOfLocalWeek(now), -(weeks - 1) * 7)
  const cells: DayCount[][] = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addLocalDays(first, w * 7 + d)
      const key = localDayKey(date)
      return { key, date, count: date > today ? 0 : (activity.get(key) ?? 0) }
    }),
  )
  const max = Math.max(0, ...cells.flat().map((c) => c.count))
  return cells.map((col) => col.map((c) => ({ ...c, level: heatLevel(c.count, max), future: c.date > today })))
}

/** "1 j 5 mnt", "12 mnt", "< 1 mnt". */
export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60_000)
  if (ms > 0 && min < 1) return '< 1 mnt'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h} j ${m} mnt` : `${m} mnt`
}
