import Dexie, { type EntityTable } from 'dexie'
import type { Card, CardState, Deck, ReviewLog, Session, Settings } from '@/types'

export class FlashcardDB extends Dexie {
  decks!: EntityTable<Deck, 'id'>
  cards!: EntityTable<Card, 'id'>
  cardStates!: EntityTable<CardState, 'cardId'>
  reviewLogs!: EntityTable<ReviewLog, 'id'>
  sessions!: EntityTable<Session, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor(name = 'flashcard') {
    super(name)
    this.version(1).stores({
      decks: 'id, name, createdAt',
      cards: 'id, deckId, type, createdAt, updatedAt',
      cardStates: 'cardId, due, state',
      reviewLogs: 'id, cardId, deckId, reviewedAt, [deckId+reviewedAt]',
      sessions: 'id, deckId, startedAt',
      settings: 'id',
    })
  }
}

export const db = new FlashcardDB()

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  theme: 'system',
  reminderTime: '19:00',
  notificationsEnabled: false,
}

export function newId(): string {
  return crypto.randomUUID()
}
