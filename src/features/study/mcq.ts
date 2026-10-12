import { shuffle, type Rng } from '@/lib/random'
import { normalizeAnswer } from '@/lib/typing'

export const MCQ_OPTIONS = 4
export const MCQ_MIN_CARDS = 4

export interface McqQuestion {
  options: string[]
  correctIndex: number
}

/** Susun 4 opsi: jawaban benar + 3 distraktor unik dari deck yang sama, diacak. */
export function buildMcq(correct: string, pool: readonly string[], rng: Rng = Math.random): McqQuestion {
  const seen = new Set([normalizeAnswer(correct)])
  const distractors: string[] = []
  for (const text of shuffle(pool, rng)) {
    const key = normalizeAnswer(text)
    if (!key || seen.has(key)) continue
    seen.add(key)
    distractors.push(text)
    if (distractors.length === MCQ_OPTIONS - 1) break
  }
  const options = shuffle([correct, ...distractors], rng)
  return { options, correctIndex: options.indexOf(correct) }
}

/**
 * Pool distraktor: utamakan kartu bertipe sama (basic ↔ basic, cloze ↔ cloze) agar
 * opsi tidak mudah ditebak dari bentuknya; tambah dari tipe lain jika kurang dari 3.
 */
export function distractorPool<T extends { id: string; type: string }>(
  current: T,
  cards: readonly T[],
  label: (card: T) => string,
): string[] {
  const others = cards.filter((c) => c.id !== current.id)
  const same = others.filter((c) => c.type === current.type).map(label)
  const distinct = new Set(same.map(normalizeAnswer).filter(Boolean))
  if (distinct.size >= MCQ_OPTIONS - 1) return same
  return [...same, ...others.filter((c) => c.type !== current.type).map(label)]
}
