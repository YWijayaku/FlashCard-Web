import { describe, expect, it } from 'vitest'
import { cardTextSizeClass } from './text'

describe('cardTextSizeClass', () => {
  it('teks makin panjang memakai ukuran makin kecil', () => {
    expect(cardTextSizeClass(5)).toContain('text-3xl')
    expect(cardTextSizeClass(60)).toContain('text-2xl')
    expect(cardTextSizeClass(150)).toContain('text-xl')
    expect(cardTextSizeClass(300)).toBe('text-lg')
    expect(cardTextSizeClass(1000)).toBe('text-base')
  })
})
