import type { CardType } from '@/types'

export type ClozeSegment = { type: 'text'; value: string } | { type: 'cloze'; value: string }

const CLOZE_RE = /\{\{(.+?)\}\}/g
export const CLOZE_MASK = '[...]'

/** True jika teks mengandung minimal satu cloze `{{...}}` yang tidak kosong. */
export function hasCloze(text: string): boolean {
  return /\{\{(.+?)\}\}/.test(text)
}

/** Kartu otomatis bertipe `cloze` jika `front` mengandung `{{...}}`. */
export function detectCardType(front: string): CardType {
  return hasCloze(front) ? 'cloze' : 'basic'
}

/** Pecah teks menjadi segmen teks biasa dan segmen cloze. */
export function parseCloze(text: string): ClozeSegment[] {
  const segments: ClozeSegment[] = []
  let last = 0
  for (const match of text.matchAll(CLOZE_RE)) {
    const start = match.index ?? 0
    if (start > last) segments.push({ type: 'text', value: text.slice(last, start) })
    segments.push({ type: 'cloze', value: match[1] })
    last = start + match[0].length
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) })
  return segments
}

/** Teks saat ditanya: setiap cloze diganti `[...]`. */
export function maskCloze(text: string): string {
  return text.replace(CLOZE_RE, CLOZE_MASK)
}

/** Teks saat dibalik: semua cloze dibuka bersamaan (kurung kurawal dihapus). */
export function revealCloze(text: string): string {
  return text.replace(CLOZE_RE, '$1')
}

/** Daftar jawaban cloze dalam urutan kemunculan. */
export function clozeAnswers(text: string): string[] {
  return Array.from(text.matchAll(CLOZE_RE), (m) => m[1])
}
