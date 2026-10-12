import { describe, expect, it } from 'vitest'
import type { CardState, ReviewLog, Session } from '@/types'
import { createInitialState } from '@/lib/srs'
import {
  activityByDay,
  currentStreak,
  formatDuration,
  heatLevel,
  heatmapWeeks,
  lastDays,
  reviewSummary,
  startOfLocalWeek,
  statusCounts,
  studyTimeMs,
} from './stats'

const day = (d: number, h = 10) => new Date(2026, 6, d, h).getTime() // Juli 2026; 15 Jul = Rabu
const NOW = day(15, 20)

function log(t: number, rating: ReviewLog['rating'] = 3, durationMs = 10_000): ReviewLog {
  return { id: String(t), cardId: 'c', deckId: 'd', rating, mode: 'flip', durationMs, reviewedAt: t, prevState: 2 }
}
const match = (t: number, ms: number): Session => ({ id: `m${t}`, deckId: 'd', mode: 'match', startedAt: t, endedAt: t + ms, cardsStudied: 6, correct: 6 })

describe('stats', () => {
  it('waktu belajar: durasi review dibatasi + sesi Match', () => {
    const logs = [log(day(15), 3, 20_000), log(day(15), 3, 60 * 60_000), log(day(14))]
    expect(studyTimeMs(logs, [match(day(15), 45_000)], day(15, 0), day(16, 0))).toBe(20_000 + 5 * 60_000 + 45_000)
  })

  it('jumlah review & akurasi', () => {
    const logs = [log(day(15), 3), log(day(15), 1), log(day(15), 4), log(day(1), 1)]
    expect(reviewSummary(logs, day(15, 0), day(16, 0))).toEqual({ count: 3, correct: 2, accuracy: 2 / 3 })
    expect(reviewSummary([], 0, 1).accuracy).toBeNull()
  })

  it('status kartu', () => {
    const s = (id: string, state: CardState['state']) => [id, { ...createInitialState(id, 0), state }] as const
    const states = new Map([s('a', 0), s('b', 1), s('c', 3), s('d', 2)])
    expect(statusCounts(['a', 'b', 'c', 'd', 'x'], states)).toEqual({ fresh: 2, learning: 2, known: 1 })
  })

  it('streak berturut-turut (hari ini belum belajar tidak memutus streak)', () => {
    const a = activityByDay([log(day(12)), log(day(13)), log(day(14))], [])
    expect(currentStreak(a, NOW)).toBe(3)
    const b = activityByDay([log(day(13)), log(day(14)), log(day(15))], [match(day(10), 1000)])
    expect(currentStreak(b, NOW)).toBe(3)
    expect(currentStreak(activityByDay([log(day(13))], []), NOW)).toBe(0)
    expect(currentStreak(new Map(), NOW)).toBe(0)
  })

  it('n hari terakhir', () => {
    const d = lastDays(activityByDay([log(day(15)), log(day(15)), log(day(9))], []), NOW, 7)
    expect(d).toHaveLength(7)
    expect(d[0].key).toBe('2026-07-09')
    expect(d.map((x) => x.count)).toEqual([1, 0, 0, 0, 0, 0, 2])
  })

  it('heatmap 12 minggu mulai Senin, hari depan ditandai', () => {
    expect(new Date(startOfLocalWeek(NOW)).getDay()).toBe(1)
    const weeks = heatmapWeeks(activityByDay([log(day(15)), log(day(14)), log(day(14))], []), NOW)
    expect(weeks).toHaveLength(12)
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(new Date(weeks[0][0].date).getDay()).toBe(1)
    const last = weeks[11]
    expect(last[2]).toMatchObject({ key: '2026-07-15', count: 1, level: 2, future: false })
    expect(last[1]).toMatchObject({ count: 2, level: 4 })
    expect(last[3].future).toBe(true)
  })

  it('level & format durasi', () => {
    expect(heatLevel(0, 10)).toBe(0)
    expect(heatLevel(1, 10)).toBe(1)
    expect(heatLevel(10, 10)).toBe(4)
    expect(formatDuration(0)).toBe('0 mnt')
    expect(formatDuration(20_000)).toBe('< 1 mnt')
    expect(formatDuration(65 * 60_000)).toBe('1 j 5 mnt')
  })
})
