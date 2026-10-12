import type { FlashcardDB } from '@/lib/db'
import type { Card, CardState, Deck, ReviewLog, Session, Settings } from '@/types'

export const BACKUP_VERSION = 1

type ImageKey = 'frontImage' | 'backImage' | 'thirdImage'
const IMAGE_KEYS: readonly ImageKey[] = ['frontImage', 'backImage', 'thirdImage']

/** Kartu dengan gambar sebagai data URL base64. */
export type SerializedCard = Omit<Card, ImageKey> & Partial<Record<ImageKey, string>>

export interface BackupData {
  decks: Deck[]
  cards: SerializedCard[]
  cardStates: CardState[]
  reviewLogs: ReviewLog[]
  sessions: Session[]
  settings: Settings[]
}

export interface BackupFile {
  version: number
  exportedAt: number
  data: BackupData
}

export type RestoreMode = 'replace' | 'merge'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  return btoa(binary)
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  if (typeof blob.arrayBuffer === 'function') {
    return `data:${blob.type};base64,${bytesToBase64(new Uint8Array(await blob.arrayBuffer()))}`
  }
  // Fallback (lingkungan tanpa Blob.arrayBuffer)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Gagal membaca gambar'))
    reader.readAsDataURL(blob)
  })
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(dataUrl)
  if (!match) throw new Error('Data gambar tidak valid')
  const [, type, isBase64, payload] = match
  if (!isBase64) return new Blob([decodeURIComponent(payload)], { type })
  const binary = atob(payload)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

async function serializeCard(card: Card): Promise<SerializedCard> {
  const out: SerializedCard = { ...card, frontImage: undefined, backImage: undefined, thirdImage: undefined }
  for (const key of IMAGE_KEYS) {
    const blob = card[key]
    if (blob) out[key] = await blobToDataUrl(blob)
    else delete out[key]
  }
  return out
}

function deserializeCard(card: SerializedCard): Card {
  const out: Card = { ...card, frontImage: undefined, backImage: undefined, thirdImage: undefined }
  for (const key of IMAGE_KEYS) {
    const url = card[key]
    if (url) out[key] = dataUrlToBlob(url)
    else delete out[key]
  }
  return out
}

/** Export seluruh data ke satu objek JSON berversi. */
export async function exportBackup(database: FlashcardDB, now: number = Date.now()): Promise<BackupFile> {
  const [decks, cards, cardStates, reviewLogs, sessions, settings] = await Promise.all([
    database.decks.toArray(),
    database.cards.toArray(),
    database.cardStates.toArray(),
    database.reviewLogs.toArray(),
    database.sessions.toArray(),
    database.settings.toArray(),
  ])
  return {
    version: BACKUP_VERSION,
    exportedAt: now,
    data: { decks, cards: await Promise.all(cards.map(serializeCard)), cardStates, reviewLogs, sessions, settings },
  }
}

export type ParseBackupResult = { ok: true; backup: BackupFile } | { ok: false; error: string }

const TABLES: readonly (keyof BackupData)[] = ['decks', 'cards', 'cardStates', 'reviewLogs', 'sessions', 'settings']

/** Validasi struktur file backup sebelum restore. */
export function parseBackup(text: string): ParseBackupResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'File bukan JSON yang valid.' }
  }
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Format backup tidak dikenali.' }
  const obj = raw as Partial<BackupFile>
  if (typeof obj.version !== 'number' || typeof obj.data !== 'object' || obj.data === null) {
    return { ok: false, error: 'Ini bukan file backup Flashcard (tidak ada "version" / "data").' }
  }
  if (obj.version > BACKUP_VERSION) {
    return { ok: false, error: `Versi backup (${obj.version}) lebih baru dari aplikasi ini. Perbarui aplikasi terlebih dahulu.` }
  }
  const data = obj.data as Partial<Record<keyof BackupData, unknown>>
  for (const t of TABLES) {
    if (data[t] !== undefined && !Array.isArray(data[t])) return { ok: false, error: `Bagian "${t}" tidak valid.` }
  }
  const cards = (data.cards ?? []) as SerializedCard[]
  const decks = (data.decks ?? []) as Deck[]
  if (decks.some((d) => typeof d?.id !== 'string') || cards.some((c) => typeof c?.id !== 'string' || typeof c?.deckId !== 'string')) {
    return { ok: false, error: 'Data deck/kartu rusak (ID tidak ditemukan).' }
  }
  return {
    ok: true,
    backup: {
      version: obj.version,
      exportedAt: typeof obj.exportedAt === 'number' ? obj.exportedAt : 0,
      data: {
        decks,
        cards,
        cardStates: (data.cardStates ?? []) as CardState[],
        reviewLogs: ((data.reviewLogs ?? []) as ReviewLog[]).map((l) => ({ ...l, prevState: l.prevState ?? 2 })),
        sessions: (data.sessions ?? []) as Session[],
        settings: (data.settings ?? []) as Settings[],
      },
    },
  }
}

/**
 * Restore: `replace` menghapus semua data lalu memasukkan backup;
 * `merge` menambahkan/menimpa berdasarkan ID dan mempertahankan pengaturan saat ini.
 */
export async function restoreBackup(database: FlashcardDB, backup: BackupFile, mode: RestoreMode): Promise<void> {
  const { data } = backup
  const cards = data.cards.map(deserializeCard)
  const tables = [database.decks, database.cards, database.cardStates, database.reviewLogs, database.sessions, database.settings]
  await database.transaction('rw', tables, async () => {
    if (mode === 'replace') await Promise.all(tables.map((t) => t.clear()))
    await database.decks.bulkPut(data.decks)
    await database.cards.bulkPut(cards)
    await database.cardStates.bulkPut(data.cardStates)
    await database.reviewLogs.bulkPut(data.reviewLogs)
    await database.sessions.bulkPut(data.sessions)
    if (mode === 'replace') await database.settings.bulkPut(data.settings)
  })
}

export function backupFileName(now: number = Date.now()): string {
  const d = new Date(now)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `flashcard-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`
}
