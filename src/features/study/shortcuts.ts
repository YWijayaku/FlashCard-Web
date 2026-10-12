import type { RatingValue } from '@/types'

export type FlipAction = { type: 'flip' } | { type: 'rate'; rating: RatingValue } | { type: 'exit' }

export interface KeyLike {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  repeat?: boolean
}

/** True jika elemen adalah input teks (shortcut dinonaktifkan di sana). */
export function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag !== 'INPUT') return false
  const type = (target as HTMLInputElement).type
  return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'color', 'file'].includes(type)
}

/**
 * Peta tombol mode Flip: Spasi = balik kartu, 1–4 = nilai (hanya setelah dibalik),
 * Esc = keluar sesi. Tidak aktif saat fokus di input teks.
 */
export function resolveFlipKey(e: KeyLike, ctx: { revealed: boolean; inTextInput: boolean }): FlipAction | null {
  if (ctx.inTextInput || e.ctrlKey || e.metaKey || e.altKey) return null
  if (e.key === 'Escape') return { type: 'exit' }
  if (e.repeat) return null
  if (e.key === ' ' || e.key === 'Spacebar') return { type: 'flip' }
  if (ctx.revealed && ['1', '2', '3', '4'].includes(e.key)) {
    return { type: 'rate', rating: Number(e.key) as RatingValue }
  }
  return null
}

export type ChoiceAction = { type: 'choose'; index: number } | { type: 'next' } | { type: 'exit' }

/**
 * Peta tombol Pilihan Ganda: 1–4 = pilih opsi (sebelum menjawab),
 * Spasi/Enter = lanjut (setelah menjawab), Esc = keluar.
 */
export function resolveChoiceKey(
  e: KeyLike,
  ctx: { answered: boolean; optionCount: number; inTextInput: boolean },
): ChoiceAction | null {
  if (ctx.inTextInput || e.ctrlKey || e.metaKey || e.altKey) return null
  if (e.key === 'Escape') return { type: 'exit' }
  if (e.repeat) return null
  if (ctx.answered) return e.key === ' ' || e.key === 'Enter' ? { type: 'next' } : null
  const n = Number(e.key)
  if (Number.isInteger(n) && n >= 1 && n <= Math.min(4, ctx.optionCount)) return { type: 'choose', index: n - 1 }
  return null
}
