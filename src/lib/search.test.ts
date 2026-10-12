import { describe, expect, it } from 'vitest'
import { searchCards } from './search'

const cards = [
  { front: '水', back: 'Air', third: 'みず' },
  { front: '{{Tokyo}} adalah ibu kota', back: '' },
  { front: 'Paris', back: 'Prancis' },
]

describe('searchCards', () => {
  it('mencari di semua sisi tanpa beda kapital', () => {
    expect(searchCards(cards, 'air')).toHaveLength(1)
    expect(searchCards(cards, 'みず')).toHaveLength(1)
    expect(searchCards(cards, '  PRANCIS ')).toHaveLength(1)
  })
  it('mengabaikan kurung cloze dan query kosong mengembalikan semua', () => {
    expect(searchCards(cards, 'tokyo adalah')).toHaveLength(1)
    expect(searchCards(cards, '')).toHaveLength(3)
    expect(searchCards(cards, 'zzz')).toHaveLength(0)
  })
})
