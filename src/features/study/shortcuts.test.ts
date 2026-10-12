import { describe, expect, it } from 'vitest'
import { isTextInputTarget, resolveFlipKey } from './shortcuts'

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
