import { fsrs, createEmptyCard, Rating, type Card as FsrsCard, type Grade } from 'ts-fsrs'
import type { CardState, RatingValue, SrsState, Timestamp } from '@/types'

const scheduler = fsrs({ enable_fuzz: false, enable_short_term: true })

export const RATINGS: readonly RatingValue[] = [1, 2, 3, 4]

export const RATING_LABELS: Record<RatingValue, string> = {
  1: 'Tidak hafal',
  2: 'Ragu',
  3: 'Hafal',
  4: 'Sangat hafal',
}

const GRADE: Record<RatingValue, Grade> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
  4: Rating.Easy,
}

export function toGrade(rating: RatingValue): Grade {
  return GRADE[rating]
}

/** State awal untuk kartu yang belum pernah dipelajari. */
export function createInitialState(cardId: string, now: Timestamp): CardState {
  return fromFsrsCard(cardId, createEmptyCard(new Date(now)))
}

export function toFsrsCard(state: CardState): FsrsCard {
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsedDays,
    scheduled_days: state.scheduledDays,
    learning_steps: state.learningSteps,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state,
    last_review: state.lastReview !== undefined ? new Date(state.lastReview) : undefined,
  }
}

export function fromFsrsCard(cardId: string, card: FsrsCard): CardState {
  const result: CardState = {
    cardId,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as SrsState,
  }
  if (card.last_review) result.lastReview = card.last_review.getTime()
  return result
}

/** Terapkan penilaian dan kembalikan state berikutnya. */
export function applyRating(state: CardState, rating: RatingValue, now: Timestamp): CardState {
  const { card } = scheduler.next(toFsrsCard(state), new Date(now), toGrade(rating))
  return fromFsrsCard(state.cardId, card)
}

/** Waktu due berikutnya untuk tiap tombol penilaian. */
export function previewDue(state: CardState, now: Timestamp): Record<RatingValue, Timestamp> {
  const preview = scheduler.repeat(toFsrsCard(state), new Date(now))
  return {
    1: preview[Rating.Again].card.due.getTime(),
    2: preview[Rating.Hard].card.due.getTime(),
    3: preview[Rating.Good].card.due.getTime(),
    4: preview[Rating.Easy].card.due.getTime(),
  }
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function fmt(value: number): string {
  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value)
  return String(rounded).replace('.', ',')
}

/** Format durasi interval dalam Bahasa Indonesia, misal "10 mnt", "3 hari". */
export function formatInterval(ms: number): string {
  if (ms < MINUTE) return '< 1 mnt'
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} mnt`
  if (ms < DAY) return `${Math.round(ms / HOUR)} jam`
  const days = ms / DAY
  if (days < 30) return `${Math.round(days)} hari`
  if (days < 365) return `${fmt(days / 30)} bln`
  return `${fmt(days / 365)} thn`
}

/** Label interval untuk tiap tombol penilaian. */
export function previewIntervals(state: CardState, now: Timestamp): Record<RatingValue, string> {
  const due = previewDue(state, now)
  return {
    1: formatInterval(due[1] - now),
    2: formatInterval(due[2] - now),
    3: formatInterval(due[3] - now),
    4: formatInterval(due[4] - now),
  }
}
