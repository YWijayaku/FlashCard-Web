import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FlashcardDB } from './db'
import { ensureInitialized } from './seed'
import { createCard, createDeck, deleteDeck, loadDeckQueue, loadDeckSummaries, recordReview, updateCard } from './store'

let database: FlashcardDB
const NOW = new Date(2026, 4, 1, 9, 0).getTime()

beforeEach(async () => {
  database = new FlashcardDB(`test-${crypto.randomUUID()}`)
  await database.open()
})

afterEach(async () => {
  await database.delete()
})

describe('seed', () => {
  it('membuat 1 deck dan 10 kartu (2 cloze) hanya saat database kosong', async () => {
    expect(await ensureInitialized(database, NOW)).toBe(true)
    expect(await database.decks.count()).toBe(1)
    const cards = await database.cards.toArray()
    expect(cards).toHaveLength(10)
    expect(cards.filter((c) => c.type === 'cloze')).toHaveLength(2)
    expect(await database.cardStates.count()).toBe(10)

    expect(await ensureInitialized(database, NOW)).toBe(false)
    expect(await database.decks.count()).toBe(1)
  })

  it('tidak membuat ulang deck contoh setelah semua deck dihapus', async () => {
    await ensureInitialized(database, NOW)
    const deck = (await database.decks.toArray())[0]
    await deleteDeck(deck.id, database)
    expect(await ensureInitialized(database, NOW)).toBe(false)
    expect(await database.decks.count()).toBe(0)
    expect(await database.cards.count()).toBe(0)
  })
})

describe('store', () => {
  it('antrian deck menghormati batas kartu baru per hari', async () => {
    const deck = await createDeck({ name: 'D', description: '', color: '#000', icon: '', theme: '', newPerDay: 2 }, NOW, database)
    for (let i = 0; i < 4; i++) await createCard(deck.id, { front: `f${i}`, back: `b${i}` }, NOW + i, database)

    let q = await loadDeckQueue(deck, NOW + 10, database)
    expect(q.fresh).toHaveLength(2)

    const first = q.fresh[0]
    await recordReview({ card: first, state: q.states.get(first.id)!, rating: 4, mode: 'flip', durationMs: 1200, now: NOW + 20 }, database)

    q = await loadDeckQueue(deck, NOW + 30, database)
    expect(q.fresh).toHaveLength(1)
    expect(q.fresh[0].id).not.toBe(first.id)

    const [summary] = await loadDeckSummaries(NOW + 30, database)
    expect(summary).toMatchObject({ total: 4, fresh: 1, due: 0 })
  })

  it('tipe kartu diperbarui otomatis saat front berubah', async () => {
    const deck = await createDeck({ name: 'D', description: '', color: '#000', icon: '', theme: '', newPerDay: 20 }, NOW, database)
    const card = await createCard(deck.id, { front: 'biasa', back: 'x', third: '  ' }, NOW, database)
    expect(card.type).toBe('basic')
    expect(card.third).toBeUndefined()
    await updateCard(card.id, { front: '{{cloze}} kini', back: 'x' }, NOW + 1, database)
    expect((await database.cards.get(card.id))?.type).toBe('cloze')
  })
})
