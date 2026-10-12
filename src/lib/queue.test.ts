import { describe, expect, it } from 'vitest'
import type { Card, CardState, ReviewLog } from '@/types'
import { createInitialState } from './srs'
import {
  buildDailyQueue,
  countNewIntroducedToday,
  queueOrder,
  shouldRequeue,
  startOfLocalDay,
  startOfNextLocalDay,
} from './queue'

const NOW = new Date(2026, 2, 10, 15, 30).getTime()
const HOUR = 3_600_000

function card(id: string, createdAt = 0): Card {
  return { id, deckId: 'd1', front: id, back: id, type: 'basic', createdAt, updatedAt: createdAt }
}

function reviewState(id: string, due: number, state: CardState['state'] = 2): CardState {
  return { ...createInitialState(id, 0), state, due, reps: 3 }
}

function log(cardId: string, reviewedAt: number, prevState: ReviewLog['prevState']): ReviewLog {
  return { id: `${cardId}-${reviewedAt}`, cardId, deckId: 'd1', rating: 3, mode: 'flip', durationMs: 1000, reviewedAt, prevState }
}

describe('hari lokal', () => {
  it('awal hari lokal dan hari berikutnya', () => {
    const start = new Date(startOfLocalDay(NOW))
    expect(start.getHours()).toBe(0)
    expect(start.getDate()).toBe(10)
    const next = new Date(startOfNextLocalDay(NOW))
    expect(next.getDate()).toBe(11)
    expect(next.getHours()).toBe(0)
  })
})

describe('countNewIntroducedToday', () => {
  it('hanya menghitung kartu baru unik yang direview hari ini', () => {
    const today = startOfLocalDay(NOW)
    const logs = [
      log('a', today + HOUR, 0),
      log('a', today + 2 * HOUR, 1), // review ulang kartu yang sama (learning)
      log('b', today + 3 * HOUR, 0),
      log('c', today - HOUR, 0), // kemarin
      log('d', today + HOUR, 2), // review biasa
    ]
    expect(countNewIntroducedToday(logs, NOW)).toBe(2)
  })
})

describe('buildDailyQueue', () => {
  const cards = [card('n1', 3), card('n2', 1), card('n3', 2), card('r1'), card('r2'), card('r3')]
  const states = new Map<string, CardState>([
    ['n3', createInitialState('n3', 0)],
    ['r1', reviewState('r1', NOW - 2 * HOUR)],
    ['r2', reviewState('r2', NOW - 5 * HOUR, 1)],
    ['r3', reviewState('r3', NOW + HOUR)], // belum due
  ])

  it('memasukkan semua kartu due (urut due) dan membatasi kartu baru', () => {
    const q = buildDailyQueue({ cards, states, newPerDay: 2, newIntroducedToday: 0, now: NOW })
    expect(q.due.map((c) => c.id)).toEqual(['r2', 'r1'])
    expect(q.fresh.map((c) => c.id)).toEqual(['n2', 'n3'])
    expect(queueOrder(q).map((c) => c.id)).toEqual(['r2', 'r1', 'n2', 'n3'])
  })

  it('mengurangi kuota dengan kartu baru yang sudah dipelajari hari ini', () => {
    const q = buildDailyQueue({ cards, states, newPerDay: 2, newIntroducedToday: 1, now: NOW })
    expect(q.fresh.map((c) => c.id)).toEqual(['n2'])
  })

  it('kuota habis: tidak ada kartu baru, review tetap tidak dibatasi', () => {
    const q = buildDailyQueue({ cards, states, newPerDay: 20, newIntroducedToday: 25, now: NOW })
    expect(q.fresh).toEqual([])
    expect(q.due).toHaveLength(2)
  })

  it('newPerDay 0 berarti tanpa kartu baru', () => {
    const q = buildDailyQueue({ cards, states, newPerDay: 0, newIntroducedToday: 0, now: NOW })
    expect(q.fresh).toEqual([])
  })
})

describe('shouldRequeue', () => {
  it('kartu learning yang due hari ini dimasukkan kembali', () => {
    expect(shouldRequeue(reviewState('x', NOW + 10 * 60_000, 1), NOW)).toBe(true)
    expect(shouldRequeue(reviewState('x', NOW + 10 * 60_000, 3), NOW)).toBe(true)
  })

  it('kartu review atau due besok tidak dimasukkan kembali', () => {
    expect(shouldRequeue(reviewState('x', NOW + 10 * 60_000, 2), NOW)).toBe(false)
    expect(shouldRequeue(reviewState('x', startOfNextLocalDay(NOW) + 1, 1), NOW)).toBe(false)
  })
})
