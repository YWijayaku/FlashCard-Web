/** Waktu disimpan sebagai epoch milidetik. */
export type Timestamp = number

export type ThemeMode = 'system' | 'light' | 'dark'
export type CardType = 'basic' | 'cloze'
export type CardSide = 'front' | 'back' | 'third'
export type StudyMode = 'flip' | 'mcq' | 'mcq-reverse' | 'typing' | 'match'
/** 1 = Tidak hafal, 2 = Ragu, 3 = Hafal, 4 = Sangat hafal */
export type RatingValue = 1 | 2 | 3 | 4
/** Sama dengan enum State ts-fsrs: 0 New, 1 Learning, 2 Review, 3 Relearning */
export type SrsState = 0 | 1 | 2 | 3

export interface Deck {
  id: string
  name: string
  description: string
  color: string
  icon: string
  /** Nama preset tema; kosong = ikut tema aplikasi. */
  theme: string
  newPerDay: number
  createdAt: Timestamp
}

export interface Card {
  id: string
  deckId: string
  front: string
  back: string
  third?: string
  frontImage?: Blob
  backImage?: Blob
  thirdImage?: Blob
  type: CardType
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CardState {
  cardId: string
  due: Timestamp
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  /** Posisi langkah (re)learning ts-fsrs v5. */
  learningSteps: number
  reps: number
  lapses: number
  state: SrsState
  lastReview?: Timestamp
}

export interface ReviewLog {
  id: string
  cardId: string
  deckId: string
  rating: RatingValue
  mode: StudyMode
  durationMs: number
  reviewedAt: Timestamp
  /** Status kartu sebelum review; dipakai untuk menghitung kartu baru per hari. */
  prevState: SrsState
}

export interface Session {
  id: string
  deckId: string
  mode: StudyMode
  startedAt: Timestamp
  endedAt?: Timestamp
  cardsStudied: number
  correct: number
}

export interface Settings {
  id: 'app'
  theme: ThemeMode
  reminderTime: string
  notificationsEnabled: boolean
}
