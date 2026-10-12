import type { FlashcardDB } from './db'
import { db, DEFAULT_SETTINGS, newId } from './db'
import { detectCardType } from './cloze'
import { EXAMPLE_DECKS, WORLD_CAPITALS, type ExampleDeck } from './examples'
import { createInitialState } from './srs'
import type { Card, Deck } from '@/types'

async function addExampleDeck(database: FlashcardDB, example: ExampleDeck, now: number): Promise<void> {
  const deck: Deck = { id: newId(), ...example.deck, createdAt: now }
  const cards: Card[] = example.cards.map((c, i) => ({
    id: newId(),
    deckId: deck.id,
    front: c.front,
    back: c.back,
    ...(c.third ? { third: c.third } : {}),
    ...(c.backSvg ? { backImage: new Blob([c.backSvg], { type: 'image/svg+xml' }) } : {}),
    type: detectCardType(c.front),
    createdAt: now + i,
    updatedAt: now + i,
  }))
  await database.decks.add(deck)
  await database.cards.bulkAdd(cards)
  await database.cardStates.bulkAdd(cards.map((c) => createInitialState(c.id, now)))
}

/**
 * Inisialisasi database: buat Settings dan deck contoh.
 * - Database kosong → semua deck contoh dibuat.
 * - Database lama → hanya deck contoh baru yang belum pernah ditambahkan.
 * Deck contoh yang sudah dihapus pengguna tidak dibuat ulang (dicatat di `seededExamples`).
 * Mengembalikan jumlah deck contoh yang ditambahkan.
 */
export async function ensureInitialized(database: FlashcardDB = db, now: number = Date.now()): Promise<number> {
  return database.transaction('rw', [database.settings, database.decks, database.cards, database.cardStates], async () => {
    const settings = await database.settings.get('app')
    const hasDecks = (await database.decks.count()) > 0
    let seeded: string[]
    if (settings) seeded = settings.seededExamples ?? [WORLD_CAPITALS.key] // versi awal hanya membuat deck ibu kota
    else seeded = hasDecks ? EXAMPLE_DECKS.map((e) => e.key) : [] // data hasil restore tanpa settings: jangan tambah apa pun
    const missing = EXAMPLE_DECKS.filter((e) => !seeded.includes(e.key))
    for (const [i, example] of missing.entries()) await addExampleDeck(database, example, now + i * 1000)
    if (!settings || missing.length > 0 || settings.seededExamples === undefined) {
      await database.settings.put({
        ...DEFAULT_SETTINGS,
        ...settings,
        seededExamples: [...seeded, ...missing.map((e) => e.key)],
      })
    }
    return missing.length
  })
}
