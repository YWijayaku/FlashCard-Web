import { hasCloze } from '@/lib/cloze'
import { parseCsv } from './csv'

export interface ImportRow {
  /** Nomor baris/urutan di file sumber (1-based, untuk pesan error). */
  line: number
  front: string
  back: string
  third: string
  errors: string[]
}

export interface ImportData {
  deck: string
  description: string
  rows: ImportRow[]
}

export type ImportResult = { ok: true; data: ImportData } | { ok: false; error: string }

export type ImportFormat = 'json' | 'csv'

export const MAX_FIELD_LENGTH = 5000

function validateRow(line: number, front: string, back: string, third: string): ImportRow {
  const errors: string[] = []
  if (!front.trim()) errors.push('Kolom "front" kosong')
  if (!back.trim() && !hasCloze(front)) errors.push('Kolom "back" kosong')
  if ([front, back, third].some((v) => v.length > MAX_FIELD_LENGTH)) errors.push(`Teks melebihi ${MAX_FIELD_LENGTH} karakter`)
  return { line, front: front.trim(), back: back.trim(), third: third.trim(), errors }
}

export function detectFormat(text: string, fileName = ''): ImportFormat {
  if (/\.json$/i.test(fileName)) return 'json'
  if (/\.csv$/i.test(fileName)) return 'csv'
  return /^\s*[{[]/.test(text) ? 'json' : 'csv'
}

function str(v: unknown): string | null {
  if (v === undefined || v === null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return null
}

/** JSON: { "deck": string, "description"?: string, "cards": [{ "front", "back", "third"? }] } */
export function parseImportJson(text: string): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSON tidak valid. Periksa tanda kurung, koma, dan tanda kutip.' }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'JSON harus berupa objek dengan "deck" dan "cards".' }
  }
  const obj = raw as Record<string, unknown>
  if (typeof obj.deck !== 'string' || !obj.deck.trim()) return { ok: false, error: 'Kolom "deck" (nama deck) wajib diisi.' }
  if (!Array.isArray(obj.cards)) return { ok: false, error: 'Kolom "cards" harus berupa array.' }
  if (obj.cards.length === 0) return { ok: false, error: 'Tidak ada kartu di "cards".' }
  const rows = obj.cards.map((c: unknown, i): ImportRow => {
    if (typeof c !== 'object' || c === null) return { line: i + 1, front: '', back: '', third: '', errors: ['Kartu harus berupa objek'] }
    const card = c as Record<string, unknown>
    const [front, back, third] = [str(card.front), str(card.back), str(card.third)]
    if (front === null || back === null || third === null) {
      return { line: i + 1, front: '', back: '', third: '', errors: ['"front", "back", "third" harus berupa teks'] }
    }
    return validateRow(i + 1, front, back, third)
  })
  const description = typeof obj.description === 'string' ? obj.description.trim() : ''
  return { ok: true, data: { deck: obj.deck.trim(), description, rows } }
}

/** CSV: header wajib berisi front,back (third opsional), urutan kolom bebas. */
export function parseImportCsv(text: string, deckName = ''): ImportResult {
  const table = parseCsv(text)
  if (table.length === 0) return { ok: false, error: 'File CSV kosong.' }
  const header = table[0].map((h) => h.trim().toLowerCase())
  const idx = { front: header.indexOf('front'), back: header.indexOf('back'), third: header.indexOf('third') }
  if (idx.front < 0 || idx.back < 0) {
    return { ok: false, error: 'Baris pertama harus header berisi kolom "front,back" (dan opsional "third").' }
  }
  const unknown = header.filter((h) => h && !['front', 'back', 'third'].includes(h))
  if (unknown.length) return { ok: false, error: `Kolom tidak dikenal: ${unknown.join(', ')}` }
  if (table.length === 1) return { ok: false, error: 'Tidak ada kartu setelah baris header.' }
  const rows = table.slice(1).map((r, i) => {
    const get = (k: number) => (k >= 0 ? (r[k] ?? '') : '')
    const row = validateRow(i + 2, get(idx.front), get(idx.back), get(idx.third))
    if (r.length > header.length) row.errors.push('Jumlah kolom melebihi header (koma tanpa tanda kutip?)')
    return row
  })
  return { ok: true, data: { deck: deckName.trim(), description: '', rows } }
}

export function parseImport(text: string, format: ImportFormat, deckName = ''): ImportResult {
  return format === 'json' ? parseImportJson(text) : parseImportCsv(text, deckName)
}

export function validRows(rows: readonly ImportRow[]): ImportRow[] {
  return rows.filter((r) => r.errors.length === 0)
}

/** Nama deck dari nama file, misal "kanji-n5.csv" → "kanji n5". */
export function deckNameFromFile(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
}
