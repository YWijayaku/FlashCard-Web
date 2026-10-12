import { describe, expect, it } from 'vitest'
import { applyRating, createInitialState, formatInterval, fromFsrsCard, previewDue, previewIntervals, toFsrsCard } from './srs'

const NOW = new Date(2026, 0, 15, 10, 0, 0).getTime()
const MIN = 60_000
const DAY = 86_400_000

describe('srs', () => {
  it('state awal adalah New dan due sekarang', () => {
    const s = createInitialState('c1', NOW)
    expect(s.cardId).toBe('c1')
    expect(s.state).toBe(0)
    expect(s.reps).toBe(0)
    expect(s.due).toBe(NOW)
  })

  it('konversi ke/dari ts-fsrs bolak-balik tanpa kehilangan data', () => {
    const s = applyRating(createInitialState('c1', NOW), 3, NOW)
    expect(fromFsrsCard('c1', toFsrsCard(s))).toEqual(s)
  })

  it('interval naik sesuai rating untuk kartu baru', () => {
    const due = previewDue(createInitialState('c1', NOW), NOW)
    expect(due[1]).toBeLessThanOrEqual(due[2])
    expect(due[2]).toBeLessThanOrEqual(due[3])
    expect(due[3]).toBeLessThan(due[4])
    expect(due[4] - NOW).toBeGreaterThanOrEqual(DAY)
  })

  it('Again pada kartu baru masuk tahap learning beberapa menit', () => {
    const next = applyRating(createInitialState('c1', NOW), 1, NOW)
    expect(next.state).toBe(1)
    expect(next.reps).toBe(1)
    expect(next.due - NOW).toBeLessThan(15 * MIN)
    expect(next.lastReview).toBe(NOW)
  })

  it('Easy pada kartu baru langsung menjadi Review', () => {
    const next = applyRating(createInitialState('c1', NOW), 4, NOW)
    expect(next.state).toBe(2)
    expect(next.scheduledDays).toBeGreaterThanOrEqual(1)
  })

  it('lupa saat review menambah lapses dan masuk relearning', () => {
    let s = applyRating(createInitialState('c1', NOW), 4, NOW)
    const later = s.due
    s = applyRating(s, 1, later)
    expect(s.lapses).toBe(1)
    expect(s.state).toBe(3)
  })

  it('preview sama dengan hasil applyRating', () => {
    const s = applyRating(createInitialState('c1', NOW), 3, NOW)
    const t = s.due
    const due = previewDue(s, t)
    expect(applyRating(s, 3, t).due).toBe(due[3])
  })

  it('label interval dalam Bahasa Indonesia', () => {
    expect(formatInterval(30_000)).toBe('< 1 mnt')
    expect(formatInterval(10 * MIN)).toBe('10 mnt')
    expect(formatInterval(3 * 60 * MIN)).toBe('3 jam')
    expect(formatInterval(3 * DAY)).toBe('3 hari')
    expect(formatInterval(45 * DAY)).toBe('1,5 bln')
    expect(formatInterval(730 * DAY)).toBe('2 thn')
    const labels = previewIntervals(createInitialState('c1', NOW), NOW)
    expect(Object.keys(labels)).toEqual(['1', '2', '3', '4'])
  })
})
