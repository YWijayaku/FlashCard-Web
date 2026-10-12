import type { StudyMode } from '@/types'
import { MCQ_MIN_CARDS } from './mcq'
import { MATCH_PAIRS } from './match'

export const MODE_LABELS: Record<StudyMode, string> = {
  flip: 'Flip',
  mcq: 'Pilihan Ganda',
  'mcq-reverse': 'Pilihan Ganda Terbalik',
  typing: 'Typing',
  match: 'Match',
}

export const MODE_DESCRIPTIONS: Record<StudyMode, string> = {
  flip: 'Balik kartu lalu nilai sendiri (4 tombol).',
  mcq: 'Pilih jawaban dari 4 opsi.',
  'mcq-reverse': 'Jawaban ditampilkan, pilih term-nya.',
  typing: 'Ketik jawaban; typo kecil dimaafkan.',
  match: `Jodohkan ${MATCH_PAIRS} pasang secepatnya. Tidak memengaruhi jadwal.`,
}

export const STUDY_MODES: readonly StudyMode[] = ['flip', 'mcq', 'mcq-reverse', 'typing', 'match']

/** Pesan jika mode tidak bisa dipakai untuk deck dengan `cardCount` kartu; null = boleh. */
export function modeUnavailableReason(mode: StudyMode, cardCount: number): string | null {
  if ((mode === 'mcq' || mode === 'mcq-reverse') && cardCount < MCQ_MIN_CARDS) {
    return `Butuh minimal ${MCQ_MIN_CARDS} kartu (deck ini punya ${cardCount}).`
  }
  if (mode === 'match' && cardCount < 2) return 'Butuh minimal 2 kartu.'
  if (cardCount === 0) return 'Deck ini belum memiliki kartu.'
  return null
}
