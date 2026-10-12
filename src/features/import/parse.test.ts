import { describe, expect, it } from 'vitest'
import { csvCell, parseCsv } from './csv'
import { deckNameFromFile, detectFormat, parseImportCsv, parseImportJson, validRows } from './parse'

describe('parseCsv', () => {
  it('mendukung tanda kutip, koma dan baris baru di dalam teks', () => {
    const csv = '﻿front,back,third\r\n"Halo, dunia","Baris 1\nBaris 2","Dia bilang ""hai"""\n\nA,B,\n'
    expect(parseCsv(csv)).toEqual([
      ['front', 'back', 'third'],
      ['Halo, dunia', 'Baris 1\nBaris 2', 'Dia bilang "hai"'],
      ['A', 'B', ''],
    ])
  })
  it('baris terakhir tanpa newline', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([['a', 'b'], ['c', 'd']])
  })
  it('csvCell meng-escape bila perlu', () => {
    expect(csvCell('biasa')).toBe('biasa')
    expect(csvCell('a,"b"')).toBe('"a,""b"""')
    expect(parseCsv(`${csvCell('x,\n"y"')},z`)).toEqual([['x,\n"y"', 'z']])
  })
})

describe('parseImportCsv', () => {
  it('header wajib dan urutan kolom bebas', () => {
    const r = parseImportCsv('BACK,front\nair,水\n,火\n', 'Kanji')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.deck).toBe('Kanji')
    expect(r.data.rows[0]).toMatchObject({ line: 2, front: '水', back: 'air', third: '', errors: [] })
    expect(r.data.rows[1].errors).toContain('Kolom "back" kosong')
    expect(validRows(r.data.rows)).toHaveLength(1)
  })
  it('menolak tanpa header yang benar atau kolom asing', () => {
    expect(parseImportCsv('a,b\n1,2').ok).toBe(false)
    expect(parseImportCsv('front,back,notes\n1,2,3').ok).toBe(false)
    expect(parseImportCsv('front,back\n').ok).toBe(false)
  })
  it('cloze boleh tanpa back; kolom berlebih ditandai', () => {
    const r = parseImportCsv('front,back\n{{A}} adalah huruf,\nx,y,z')
    if (!r.ok) throw new Error(r.error)
    expect(r.data.rows[0].errors).toEqual([])
    expect(r.data.rows[1].errors).toHaveLength(1)
  })
})

describe('parseImportJson', () => {
  it('format valid', () => {
    const r = parseImportJson(JSON.stringify({ deck: ' Kanji ', description: 'N5', cards: [{ front: '水', back: 'air', third: 'みず' }, { front: '', back: 'x' }] }))
    if (!r.ok) throw new Error(r.error)
    expect(r.data).toMatchObject({ deck: 'Kanji', description: 'N5' })
    expect(r.data.rows[0]).toMatchObject({ front: '水', back: 'air', third: 'みず', errors: [] })
    expect(r.data.rows[1].errors).toHaveLength(1)
  })
  it('pesan error yang jelas', () => {
    expect(parseImportJson('{bad')).toMatchObject({ ok: false })
    expect(parseImportJson('[]')).toMatchObject({ ok: false })
    expect(parseImportJson('{"deck":"","cards":[]}')).toMatchObject({ ok: false })
    expect(parseImportJson('{"deck":"D","cards":{}}')).toMatchObject({ ok: false })
    const r = parseImportJson('{"deck":"D","cards":[1,{"front":{},"back":"b"}]}')
    if (!r.ok) throw new Error(r.error)
    expect(r.data.rows.every((row) => row.errors.length > 0)).toBe(true)
  })
})

describe('helper', () => {
  it('deteksi format & nama deck dari file', () => {
    expect(detectFormat('{"deck":1}')).toBe('json')
    expect(detectFormat('front,back')).toBe('csv')
    expect(detectFormat('x', 'a.JSON')).toBe('json')
    expect(deckNameFromFile('kanji-n5_dasar.csv')).toBe('kanji n5 dasar')
  })
})
