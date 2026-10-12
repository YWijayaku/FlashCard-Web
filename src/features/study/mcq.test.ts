import { describe, expect, it } from 'vitest'
import { seededRng, shuffle } from '@/lib/random'
import { buildMcq, distractorPool } from './mcq'
import { modeUnavailableReason } from './modes'
import { formatElapsed, initialMatchState, isMatchComplete, makeTiles, pickPairs, tapTile } from './match'

describe('buildMcq', () => {
  it('4 opsi unik termasuk jawaban benar', () => {
    const q = buildMcq('Tokyo', ['Paris', 'tokyo', 'Seoul', 'Paris', 'Kairo', 'Ankara'], seededRng(1))
    expect(q.options).toHaveLength(4)
    expect(q.options[q.correctIndex]).toBe('Tokyo')
    expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(4)
  })

  it('pool kecil menghasilkan opsi lebih sedikit', () => {
    const q = buildMcq('A', ['B', 'A', ''], seededRng(2))
    expect(q.options.sort()).toEqual(['A', 'B'])
  })
})

describe('match', () => {
  const pairs = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, left: `L${i}`, right: `R${i}` }))

  it('maks 6 pasang, atau jumlah yang ada', () => {
    expect(pickPairs(pairs, seededRng(3))).toHaveLength(6)
    expect(pickPairs(pairs.slice(0, 3), seededRng(3))).toHaveLength(3)
    expect(makeTiles(pairs.slice(0, 3), seededRng(3))).toHaveLength(6)
  })

  it('tap: cocok, salah, batal pilih', () => {
    let s = tapTile(initialMatchState, 'c1:l')
    expect(s.selected).toBe('c1:l')
    s = tapTile(s, 'c1:l')
    expect(s.selected).toBeNull()
    s = tapTile(tapTile(s, 'c1:l'), 'c2:r')
    expect(s.wrong).toEqual(['c1:l', 'c2:r'])
    expect(s.matched.size).toBe(0)
    s = tapTile(tapTile(s, 'c1:r'), 'c1:l')
    expect(s.matched.has('c1')).toBe(true)
    expect(tapTile(s, 'c1:l')).toBe(s) // yang sudah cocok diabaikan
    expect(isMatchComplete(s, 1)).toBe(true)
    expect(isMatchComplete(s, 2)).toBe(false)
  })

  it('format waktu', () => {
    expect(formatElapsed(0)).toBe('0:00.0')
    expect(formatElapsed(83_450)).toBe('1:23.4')
  })

  it('shuffle tidak mengubah isi', () => {
    expect(shuffle([1, 2, 3, 4], seededRng(9)).sort()).toEqual([1, 2, 3, 4])
  })
})

describe('modeUnavailableReason', () => {
  it('Pilihan Ganda nonaktif untuk deck < 4 kartu', () => {
    expect(modeUnavailableReason('mcq', 3)).toMatch(/minimal 4/)
    expect(modeUnavailableReason('mcq-reverse', 3)).toMatch(/minimal 4/)
    expect(modeUnavailableReason('mcq', 4)).toBeNull()
    expect(modeUnavailableReason('match', 3)).toBeNull()
    expect(modeUnavailableReason('flip', 0)).not.toBeNull()
  })
})

describe('distractorPool', () => {
  const c = (id: string, type: string) => ({ id, type, text: id })
  const label = (x: { text: string }) => x.text
  it('mengutamakan tipe kartu yang sama', () => {
    const cards = [c('a', 'basic'), c('b', 'basic'), c('d', 'basic'), c('e', 'basic'), c('z', 'cloze')]
    expect(distractorPool(cards[0], cards, label)).toEqual(['b', 'd', 'e'])
  })
  it('menambah dari tipe lain jika kurang', () => {
    const cards = [c('z', 'cloze'), c('y', 'cloze'), c('a', 'basic'), c('b', 'basic')]
    expect(distractorPool(cards[0], cards, label)).toEqual(['y', 'a', 'b'])
  })
})
