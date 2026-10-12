import { describe, expect, it } from 'vitest'
import { clozeAnswers, detectCardType, hasCloze, maskCloze, parseCloze, revealCloze } from './cloze'

describe('cloze', () => {
  it('mendeteksi cloze', () => {
    expect(hasCloze('Ibu kota Jepang adalah {{Tokyo}}')).toBe(true)
    expect(hasCloze('Tanpa cloze')).toBe(false)
    expect(hasCloze('Kosong {{}}')).toBe(false)
    expect(hasCloze('Satu kurung {Tokyo}')).toBe(false)
  })

  it('menentukan tipe kartu dari front', () => {
    expect(detectCardType('{{H2O}} adalah air')).toBe('cloze')
    expect(detectCardType('Apa rumus air?')).toBe('basic')
  })

  it('menyembunyikan semua cloze dengan [...]', () => {
    expect(maskCloze('{{Soekarno}} dan {{Hatta}} memproklamasikan kemerdekaan')).toBe(
      '[...] dan [...] memproklamasikan kemerdekaan',
    )
  })

  it('membuka semua cloze bersamaan', () => {
    expect(revealCloze('{{Soekarno}} dan {{Hatta}}')).toBe('Soekarno dan Hatta')
  })

  it('memecah teks menjadi segmen', () => {
    expect(parseCloze('A {{b}} c {{d e}}')).toEqual([
      { type: 'text', value: 'A ' },
      { type: 'cloze', value: 'b' },
      { type: 'text', value: ' c ' },
      { type: 'cloze', value: 'd e' },
    ])
    expect(parseCloze('teks biasa')).toEqual([{ type: 'text', value: 'teks biasa' }])
    expect(parseCloze('')).toEqual([])
  })

  it('cloze non-greedy dan daftar jawaban', () => {
    expect(clozeAnswers('{{a}}{{b}} {{c}}')).toEqual(['a', 'b', 'c'])
    expect(maskCloze('{{a}}{{b}}')).toBe('[...][...]')
  })

  it('teks tanpa cloze tidak berubah', () => {
    expect(maskCloze('halo')).toBe('halo')
    expect(revealCloze('halo')).toBe('halo')
  })
})
