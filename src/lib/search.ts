import type { Card } from '@/types'
import { normalizeAnswer } from './typing'

/** Cari teks di sisi depan, belakang, dan ketiga (tanpa beda kapital/spasi; kurung cloze diabaikan). */
export function searchCards<T extends Pick<Card, 'front' | 'back' | 'third'>>(cards: readonly T[], query: string): T[] {
  const q = normalizeAnswer(query)
  if (!q) return [...cards]
  return cards.filter((c) => normalizeAnswer(`${c.front} ${c.back} ${c.third ?? ''}`.replace(/\{\{|\}\}/g, '')).includes(q))
}
