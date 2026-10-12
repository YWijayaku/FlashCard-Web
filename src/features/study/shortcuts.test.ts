import { describe, expect, it } from 'vitest'
import { isTextInputTarget, resolveChoiceKey, resolveFlipKey } from './shortcuts'

const idle = { revealed: false, inTextInput: false }
const shown = { revealed: true, inTextInput: false }

describe('resolveFlipKey', () => {
  it('Spasi membalik kartu', () => {
    expect(resolveFlipKey({ key: ' ' }, idle)).toEqual({ type: 'flip' })
    expect(resolveFlipKey({ key: ' ' }, shown)).toEqual({ type: 'flip' })
  })

  it('1–4 menilai hanya setelah kartu dibalik', () => {
    expect(resolveFlipKey({ key: '3' }, idle)).toBeNull()
    expect(resolveFlipKey({ key: '1' }, shown)).toEqual({ type: 'rate', rating: 1 })
    expect(resolveFlipKey({ key: '4' }, shown)).toEqual({ type: 'rate', rating: 4 })
    expect(resolveFlipKey({ key: '5' }, shown)).toBeNull()
  })

  it('Esc keluar sesi', () => {
    expect(resolveFlipKey({ key: 'Escape' }, idle)).toEqual({ type: 'exit' })
  })

  it('nonaktif di input teks, dengan modifier, atau saat key repeat', () => {
    expect(resolveFlipKey({ key: ' ' }, { revealed: false, inTextInput: true })).toBeNull()
    expect(resolveFlipKey({ key: '1', ctrlKey: true }, shown)).toBeNull()
    expect(resolveFlipKey({ key: '2', repeat: true }, shown)).toBeNull()
  })
})

describe('isTextInputTarget', () => {
  it('mengenali input teks', () => {
    expect(isTextInputTarget(document.createElement('textarea'))).toBe(true)
    const text = document.createElement('input')
    expect(isTextInputTarget(text)).toBe(true)
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    expect(isTextInputTarget(checkbox)).toBe(false)
    expect(isTextInputTarget(document.createElement('button'))).toBe(false)
    expect(isTextInputTarget(null)).toBe(false)
  })
})

describe('resolveChoiceKey', () => {
  const base = { answered: false, optionCount: 4, inTextInput: false }
  it('1–4 memilih opsi sebelum menjawab', () => {
    expect(resolveChoiceKey({ key: '2' }, base)).toEqual({ type: 'choose', index: 1 })
    expect(resolveChoiceKey({ key: '4' }, { ...base, optionCount: 3 })).toBeNull()
    expect(resolveChoiceKey({ key: ' ' }, base)).toBeNull()
  })
  it('Spasi/Enter lanjut setelah menjawab, Esc keluar', () => {
    expect(resolveChoiceKey({ key: 'Enter' }, { ...base, answered: true })).toEqual({ type: 'next' })
    expect(resolveChoiceKey({ key: '1' }, { ...base, answered: true })).toBeNull()
    expect(resolveChoiceKey({ key: 'Escape' }, base)).toEqual({ type: 'exit' })
    expect(resolveChoiceKey({ key: '1' }, { ...base, inTextInput: true })).toBeNull()
  })
})
