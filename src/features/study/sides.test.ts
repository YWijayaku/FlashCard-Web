import { describe, expect, it } from 'vitest'
import type { Card } from '@/types'
import { answerLabel, answerViews, availableSides, expectedAnswers, hasSideContent, questionView } from './sides'

function card(partial: Partial<Card>): Card {
  return { id: 'c', deckId: 'd', front: 'F', back: 'B', type: 'basic', createdAt: 0, updatedAt: 0, ...partial }
}

describe('sides', () => {
  it('sisi ketiga hanya tersedia jika ada kartu yang memilikinya', () => {
    expect(availableSides([card({})])).toEqual(['front', 'back'])
    expect(availableSides([card({}), card({ third: 'T' })])).toEqual(['front', 'back', 'third'])
    expect(hasSideContent(card({ third: '  ' }), 'third')).toBe(false)
    expect(hasSideContent(card({ thirdImage: new Blob() }), 'third')).toBe(true)
  })

  it('kartu basic: pertanyaan dan jawaban sesuai sisi', () => {
    const c = card({ third: 'T' })
    expect(questionView(c, 'back')).toEqual({ text: 'B', image: undefined })
    expect(answerViews(c, 'back', 'third')).toEqual([{ text: 'T', image: undefined }])
  })

  it('kartu cloze ditanya dari depan: masked lalu revealed + catatan', () => {
    const c = card({ type: 'cloze', front: '{{A}} dan {{B}}', back: 'catatan' })
    expect(questionView(c, 'front').cloze).toBe('masked')
    const views = answerViews(c, 'front', 'back')
    expect(views[0]).toMatchObject({ text: '{{A}} dan {{B}}', cloze: 'revealed' })
    expect(views[1]).toMatchObject({ text: 'catatan' })
  })

  it('kartu cloze tanpa sisi belakang hanya menampilkan depan yang terbuka', () => {
    const c = card({ type: 'cloze', front: '{{A}}', back: '' })
    expect(answerViews(c, 'front', 'back')).toHaveLength(1)
  })

  it('kartu cloze dengan jawaban di sisi depan: tampil terbuka', () => {
    const c = card({ type: 'cloze', front: '{{A}}', back: 'B' })
    expect(questionView(c, 'back').cloze).toBeUndefined()
    expect(answerViews(c, 'back', 'front')).toEqual([{ text: '{{A}}', image: undefined, cloze: 'revealed' }])
  })
})

describe('expectedAnswers', () => {
  it('kartu basic memakai teks sisi jawaban', () => {
    const c = card({ third: ' みず ' })
    expect(expectedAnswers(c, 'front', 'third')).toEqual(['みず'])
    expect(expectedAnswers(card({ back: '' }), 'front', 'back')).toEqual([])
  })
  it('cloze dari depan memakai isi cloze; dari sisi lain memakai depan terbuka', () => {
    const c = card({ type: 'cloze', front: '{{A}} dan {{B}}', back: 'x' })
    expect(expectedAnswers(c, 'front', 'back')).toEqual(['A', 'B'])
    expect(answerLabel(c, 'front', 'back')).toBe('A, B')
    expect(expectedAnswers(c, 'back', 'front')).toEqual(['A dan B'])
  })
})
