import { shuffle, type Rng } from '@/lib/random'

export const MATCH_PAIRS = 6

export interface MatchPair {
  id: string
  left: string
  right: string
}

export interface MatchTile {
  key: string
  pairId: string
  text: string
}

/** Ambil maks 6 pasang acak (pakai jumlah yang ada jika kurang). */
export function pickPairs(pairs: readonly MatchPair[], rng: Rng = Math.random, count = MATCH_PAIRS): MatchPair[] {
  return shuffle(pairs, rng).slice(0, count)
}

export function makeTiles(pairs: readonly MatchPair[], rng: Rng = Math.random): MatchTile[] {
  const tiles = pairs.flatMap((p) => [
    { key: `${p.id}:l`, pairId: p.id, text: p.left },
    { key: `${p.id}:r`, pairId: p.id, text: p.right },
  ])
  return shuffle(tiles, rng)
}

export interface MatchState {
  selected: string | null
  matched: ReadonlySet<string>
  /** Pasangan yang baru salah (untuk animasi singkat). */
  wrong: readonly [string, string] | null
}

export const initialMatchState: MatchState = { selected: null, matched: new Set(), wrong: null }

function pairOf(key: string): string {
  return key.slice(0, key.lastIndexOf(':'))
}

/** Logika tap: pilih tile pertama, lalu tile kedua → cocok atau salah. */
export function tapTile(state: MatchState, key: string): MatchState {
  const pairId = pairOf(key)
  if (state.matched.has(pairId)) return state
  if (state.selected === null) return { ...state, selected: key, wrong: null }
  if (state.selected === key) return { ...state, selected: null }
  if (pairOf(state.selected) === pairId) {
    return { selected: null, matched: new Set([...state.matched, pairId]), wrong: null }
  }
  return { ...state, selected: null, wrong: [state.selected, key] }
}

export function isMatchComplete(state: MatchState, pairCount: number): boolean {
  return pairCount > 0 && state.matched.size === pairCount
}

/** Format waktu mm:ss.d */
export function formatElapsed(ms: number): string {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSec = Math.floor(totalTenths / 10)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}.${tenths}`
}
