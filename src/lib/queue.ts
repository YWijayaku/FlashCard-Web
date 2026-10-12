import type { Card, CardState, ReviewLog, Timestamp } from '@/types'

/** Awal hari (00:00) menurut zona waktu lokal. */
export function startOfLocalDay(now: Timestamp): Timestamp {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Awal hari berikutnya menurut zona waktu lokal (aman terhadap DST). */
export function startOfNextLocalDay(now: Timestamp): Timestamp {
  const d = new Date(startOfLocalDay(now))
  d.setDate(d.getDate() + 1)
  return d.getTime()
}

export function isNewCard(state: CardState | undefined): boolean {
  return state === undefined || state.state === 0
}

/** Jumlah kartu baru yang sudah diperkenalkan (review pertama) hari ini. */
export function countNewIntroducedToday(logs: readonly ReviewLog[], now: Timestamp): number {
  const start = startOfLocalDay(now)
  const end = startOfNextLocalDay(now)
  const ids = new Set<string>()
  for (const log of logs) {
    if (log.prevState === 0 && log.reviewedAt >= start && log.reviewedAt < end) ids.add(log.cardId)
  }
  return ids.size
}

export interface QueueInput {
  cards: readonly Card[]
  states: ReadonlyMap<string, CardState>
  newPerDay: number
  newIntroducedToday: number
  now: Timestamp
}

export interface DailyQueue {
  /** Kartu review/learning yang sudah jatuh tempo (tidak dibatasi). */
  due: Card[]
  /** Kartu baru, dibatasi sisa kuota `newPerDay` hari ini. */
  fresh: Card[]
}

/** Susun antrian harian satu deck: semua kartu due + kartu baru maks sisa kuota. */
export function buildDailyQueue(input: QueueInput): DailyQueue {
  const { cards, states, newPerDay, newIntroducedToday, now } = input
  const due: { card: Card; due: Timestamp }[] = []
  const fresh: Card[] = []
  for (const card of cards) {
    const state = states.get(card.id)
    if (isNewCard(state)) fresh.push(card)
    else if (state && state.due <= now) due.push({ card, due: state.due })
  }
  due.sort((a, b) => a.due - b.due)
  fresh.sort((a, b) => a.createdAt - b.createdAt)
  const remaining = Math.max(0, newPerDay - newIntroducedToday)
  return { due: due.map((d) => d.card), fresh: fresh.slice(0, remaining) }
}

/** Urutan belajar: kartu due lebih dulu, lalu kartu baru. */
export function queueOrder(queue: DailyQueue): Card[] {
  return [...queue.due, ...queue.fresh]
}

/**
 * Setelah dinilai, kartu yang masih dalam tahap (re)learning dan jatuh tempo
 * sebelum hari berganti dimasukkan kembali ke akhir antrian sesi.
 */
export function shouldRequeue(next: CardState, now: Timestamp): boolean {
  return (next.state === 1 || next.state === 3) && next.due < startOfNextLocalDay(now)
}
