import { describe, expect, it } from 'vitest'
import { checkTyping, isCloseEnough, levenshtein, normalizeAnswer, typoTolerance } from './typing'

describe('typing matcher', () => {
  it('normalisasi kapital dan spasi', () => {
    expect(normalizeAnswer('  Kota   TOKYO ')).toBe('kota tokyo')
  })

  it('levenshtein', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('水', '火')).toBe(1)
    expect(levenshtein('sama', 'sama')).toBe(0)
  })

  it('toleransi: ≤1 untuk ≤6 huruf, ≤2 untuk lebih panjang', () => {
    expect(typoTolerance('tokyo')).toBe(1)
    expect(typoTolerance('canberra')).toBe(2)
    expect(isCloseEnough('tokio', 'Tokyo')).toBe(true)
    expect(isCloseEnough('takio', 'Tokyo')).toBe(false)
    expect(isCloseEnough('kanbera', 'Canberra')).toBe(true)
    expect(isCloseEnough('kanbara', 'Canberra')).toBe(false)
  })

  it('jawaban kosong tidak pernah benar', () => {
    expect(isCloseEnough('', '')).toBe(false)
    expect(checkTyping('x', [])).toBe(false)
  })

  it('cloze ganda: dipisah koma atau digabung', () => {
    expect(checkTyping('jakarta, nusantara', ['Jakarta', 'Nusantara'])).toBe(true)
    expect(checkTyping('Jakarta Nusantara', ['Jakarta', 'Nusantara'])).toBe(true)
    expect(checkTyping('Jakarta', ['Jakarta', 'Nusantara'])).toBe(false)
  })
})
