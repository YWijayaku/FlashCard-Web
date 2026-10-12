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
