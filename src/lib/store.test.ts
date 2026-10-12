import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FlashcardDB } from './db'
import { ensureInitialized } from './seed'
import { bulkCreateCards, createCard, createDeck, deleteDeck, loadDeckQueue, loadDeckSummaries, recordReview, updateCard } from './store'

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
  it('database kosong: semua deck contoh, termasuk deck 3 sisi bergambar', async () => {
    expect(await ensureInitialized(database, NOW)).toBe(2)
    const decks = await database.decks.orderBy('createdAt').toArray()
    expect(decks.map((d) => d.name)).toEqual(['Contoh: Ibu Kota Dunia', 'Contoh: Kanji Dasar (N5)'])
    const capitals = await database.cards.where('deckId').equals(decks[0].id).toArray()
    expect(capitals).toHaveLength(10)
    expect(capitals.filter((c) => c.type === 'cloze')).toHaveLength(2)
    const kanji = await database.cards.where('deckId').equals(decks[1].id).toArray()
    expect(kanji.length).toBeGreaterThanOrEqual(20)
    expect(kanji.every((c) => c.third)).toBe(true)
    expect(kanji.filter((c) => c.type === 'cloze')).toHaveLength(2)
    expect(kanji.filter((c) => c.backImage).length).toBeGreaterThan(0)
    expect(await database.cardStates.count()).toBe(capitals.length + kanji.length)

    expect(await ensureInitialized(database, NOW)).toBe(0)
    expect(await database.decks.count()).toBe(2)
  })

  it('database lama (versi 1) hanya mendapat deck contoh baru', async () => {
    await database.settings.put({ id: 'app', theme: 'dark', reminderTime: '07:00', notificationsEnabled: false })
    await createDeck({ name: 'Milik saya', description: '', color: '#000', icon: '', theme: '', newPerDay: 20 }, NOW, database)
    expect(await ensureInitialized(database, NOW)).toBe(1)
    expect((await database.decks.toArray()).map((d) => d.name).sort()).toEqual(['Contoh: Kanji Dasar (N5)', 'Milik saya'])
    const settings = await database.settings.get('app')
    expect(settings).toMatchObject({ theme: 'dark', seededExamples: ['world-capitals', 'kanji-n5'] })
  })

  it('tidak membuat ulang deck contoh setelah semua deck dihapus', async () => {
    await ensureInitialized(database, NOW)
    for (const deck of await database.decks.toArray()) await deleteDeck(deck.id, database)
    expect(await ensureInitialized(database, NOW)).toBe(0)
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

describe('bulkCreateCards', () => {
  it('menyimpan kartu + state, cloze terdeteksi, urutan terjaga', async () => {
    const deck = await createDeck({ name: 'D', description: '', color: '#000', icon: '', theme: '', newPerDay: 20 }, NOW, database)
    const n = await bulkCreateCards(deck.id, [{ front: 'a', back: 'b', third: '' }, { front: '{{c}} d', back: '' }], NOW, database)
    expect(n).toBe(2)
    const cards = await database.cards.where('deckId').equals(deck.id).sortBy('createdAt')
    expect(cards.map((c) => c.type)).toEqual(['basic', 'cloze'])
    expect(cards[0].third).toBeUndefined()
    expect(await database.cardStates.count()).toBe(2)
  })
})
