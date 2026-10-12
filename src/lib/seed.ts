import type { FlashcardDB } from './db'
import { db, DEFAULT_SETTINGS, newId } from './db'
import { detectCardType } from './cloze'
import { createInitialState } from './srs'
import type { Card, Deck } from '@/types'

const SAMPLE_CARDS: { front: string; back: string; third?: string }[] = [
  { front: 'Ibu kota Jepang', back: 'Tokyo', third: 'Asia Timur' },
  { front: 'Ibu kota Prancis', back: 'Paris', third: 'Eropa Barat' },
  { front: 'Ibu kota Australia', back: 'Canberra', third: 'Oseania' },
  { front: 'Ibu kota Kanada', back: 'Ottawa', third: 'Amerika Utara' },
  { front: 'Ibu kota Brasil', back: 'Brasília', third: 'Amerika Selatan' },
  { front: 'Ibu kota Mesir', back: 'Kairo', third: 'Afrika Utara' },
  { front: 'Ibu kota Korea Selatan', back: 'Seoul', third: 'Asia Timur' },
  { front: 'Ibu kota Turki', back: 'Ankara', third: 'Eropa/Asia' },
  { front: 'Ibu kota Indonesia saat ini adalah {{Jakarta}}, akan dipindah ke {{Nusantara}}', back: 'Jakarta → IKN Nusantara di Kalimantan Timur' },
  { front: '{{Nairobi}} adalah ibu kota {{Kenya}}', back: 'Nairobi, Kenya (Afrika Timur)' },
]

/**
 * Inisialisasi database saat pertama kali dibuka: buat Settings dan deck contoh.
 * Hanya berjalan jika database benar-benar kosong (belum ada Settings maupun deck),
 * sehingga deck contoh tidak muncul lagi setelah pengguna menghapusnya.
 */
export async function ensureInitialized(database: FlashcardDB = db, now: number = Date.now()): Promise<boolean> {
  return database.transaction('rw', [database.settings, database.decks, database.cards, database.cardStates], async () => {
    const hasSettings = (await database.settings.count()) > 0
    const hasDecks = (await database.decks.count()) > 0
    if (hasSettings || hasDecks) {
      if (!hasSettings) await database.settings.put(DEFAULT_SETTINGS)
      return false
    }
    await database.settings.put(DEFAULT_SETTINGS)
    const deck: Deck = {
      id: newId(),
      name: 'Contoh: Ibu Kota Dunia',
      description: 'Deck contoh. Sisi ketiga berisi wilayah. Dua kartu terakhir memakai cloze.',
      color: '#4f46e5',
      icon: '🌍',
      theme: '',
      newPerDay: 20,
      createdAt: now,
    }
    const cards: Card[] = SAMPLE_CARDS.map((c, i) => ({
      id: newId(),
      deckId: deck.id,
      front: c.front,
      back: c.back,
      ...(c.third ? { third: c.third } : {}),
      type: detectCardType(c.front),
      createdAt: now + i,
      updatedAt: now + i,
    }))
    await database.decks.add(deck)
    await database.cards.bulkAdd(cards)
    await database.cardStates.bulkAdd(cards.map((c) => createInitialState(c.id, now)))
    return true
  })
}
