import type { Card, CardState, Deck, RatingValue, Session, StudyMode, Timestamp } from '@/types'
import { db, newId, type FlashcardDB } from './db'
import { detectCardType } from './cloze'
import { applyRating, createInitialState } from './srs'
import { buildDailyQueue, countNewIntroducedToday, startOfLocalDay, type DailyQueue } from './queue'

export const DEFAULT_NEW_PER_DAY = 20

export type DeckInput = Pick<Deck, 'name' | 'description' | 'color' | 'icon' | 'theme' | 'newPerDay'>
export type CardInput = Pick<Card, 'front' | 'back' | 'third' | 'frontImage' | 'backImage' | 'thirdImage'>

export async function createDeck(input: DeckInput, now: Timestamp = Date.now(), database: FlashcardDB = db): Promise<Deck> {
  const deck: Deck = { id: newId(), ...input, createdAt: now }
  await database.decks.add(deck)
  return deck
}

export async function updateDeck(id: string, input: DeckInput, database: FlashcardDB = db): Promise<void> {
  await database.decks.update(id, input)
}

/** Hapus deck beserta kartu, state, log, dan sesi miliknya. */
export async function deleteDeck(id: string, database: FlashcardDB = db): Promise<void> {
  await database.transaction(
    'rw',
    [database.decks, database.cards, database.cardStates, database.reviewLogs, database.sessions],
    async () => {
      const cardIds = (await database.cards.where('deckId').equals(id).primaryKeys()) as string[]
      await database.cardStates.bulkDelete(cardIds)
      await database.cards.bulkDelete(cardIds)
      await database.reviewLogs.where('deckId').equals(id).delete()
      await database.sessions.where('deckId').equals(id).delete()
      await database.decks.delete(id)
    },
  )
}

function normalizeCard(input: CardInput): CardInput {
  const third = input.third?.trim() ? input.third : undefined
  return { ...input, front: input.front, back: input.back, third }
}

export async function createCard(
  deckId: string,
  input: CardInput,
  now: Timestamp = Date.now(),
  database: FlashcardDB = db,
): Promise<Card> {
  const data = normalizeCard(input)
  const card: Card = { id: newId(), deckId, ...data, type: detectCardType(data.front), createdAt: now, updatedAt: now }
  await database.transaction('rw', database.cards, database.cardStates, async () => {
    await database.cards.add(card)
    await database.cardStates.add(createInitialState(card.id, now))
  })
  return card
}

export async function updateCard(
  id: string,
  input: CardInput,
  now: Timestamp = Date.now(),
  database: FlashcardDB = db,
): Promise<void> {
  const existing = await database.cards.get(id)
  if (!existing) return
  const data = normalizeCard(input)
  // put (bukan update) agar gambar/third yang dihapus benar-benar hilang.
  await database.cards.put({
    id: existing.id,
    deckId: existing.deckId,
    createdAt: existing.createdAt,
    ...data,
    type: detectCardType(data.front),
    updatedAt: now,
  })
}

export async function deleteCard(id: string, database: FlashcardDB = db): Promise<void> {
  await database.transaction('rw', database.cards, database.cardStates, database.reviewLogs, async () => {
    await database.cards.delete(id)
    await database.cardStates.delete(id)
    await database.reviewLogs.where('cardId').equals(id).delete()
  })
}

export interface ReviewInput {
  card: Card
  state: CardState
  rating: RatingValue
  mode: StudyMode
  durationMs: number
  now?: Timestamp
}

/** Simpan hasil penilaian: perbarui state FSRS dan catat ReviewLog. */
export async function recordReview(input: ReviewInput, database: FlashcardDB = db): Promise<CardState> {
  const now = input.now ?? Date.now()
  const next = applyRating(input.state, input.rating, now)
  await database.transaction('rw', database.cardStates, database.reviewLogs, async () => {
    await database.cardStates.put(next)
    await database.reviewLogs.add({
      id: newId(),
      cardId: input.card.id,
      deckId: input.card.deckId,
      rating: input.rating,
      mode: input.mode,
      durationMs: Math.max(0, Math.round(input.durationMs)),
      reviewedAt: now,
      prevState: input.state.state,
    })
  })
  return next
}

export interface DeckQueue extends DailyQueue {
  states: Map<string, CardState>
}

/** Antrian harian untuk satu deck. */
export async function loadDeckQueue(deck: Deck, now: Timestamp = Date.now(), database: FlashcardDB = db): Promise<DeckQueue> {
  const cards = await database.cards.where('deckId').equals(deck.id).toArray()
  const stateList = await database.cardStates.bulkGet(cards.map((c) => c.id))
  const states = new Map<string, CardState>()
  for (const s of stateList) if (s) states.set(s.cardId, s)
  const logs = await database.reviewLogs
    .where('[deckId+reviewedAt]')
    .between([deck.id, startOfLocalDay(now)], [deck.id, Infinity])
    .toArray()
  const queue = buildDailyQueue({
    cards,
    states,
    newPerDay: deck.newPerDay,
    newIntroducedToday: countNewIntroducedToday(logs, now),
    now,
  })
  return { ...queue, states }
}

export interface DeckSummary {
  deck: Deck
  total: number
  due: number
  fresh: number
}

export async function loadDeckSummaries(now: Timestamp = Date.now(), database: FlashcardDB = db): Promise<DeckSummary[]> {
  const decks = await database.decks.orderBy('createdAt').toArray()
  return Promise.all(
    decks.map(async (deck) => {
      const queue = await loadDeckQueue(deck, now, database)
      return { deck, total: queue.states.size, due: queue.due.length, fresh: queue.fresh.length }
    }),
  )
}

export async function startSession(deckId: string, mode: StudyMode, database: FlashcardDB = db): Promise<Session> {
  const session: Session = { id: newId(), deckId, mode, startedAt: Date.now(), cardsStudied: 0, correct: 0 }
  await database.sessions.add(session)
  return session
}

export async function updateSession(
  id: string,
  patch: Pick<Session, 'cardsStudied' | 'correct'> & { endedAt?: Timestamp },
  database: FlashcardDB = db,
): Promise<void> {
  await database.sessions.update(id, patch)
}
