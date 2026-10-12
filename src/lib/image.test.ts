import { describe, expect, it } from 'vitest'
import { fitWidth } from './image'

describe('fitWidth', () => {
  it('tidak mengubah gambar yang lebih kecil', () => {
    expect(fitWidth(800, 600)).toEqual({ width: 800, height: 600 })
  })
  it('mengecilkan ke lebar maks dengan rasio tetap', () => {
    expect(fitWidth(2400, 1600)).toEqual({ width: 1200, height: 800 })
    expect(fitWidth(3000, 1001)).toEqual({ width: 1200, height: 400 })
  })
})
