/** Normalisasi jawaban: abaikan kapital, spasi berlebih, dan bentuk Unicode. */
export function normalizeAnswer(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Jarak Levenshtein (jumlah sisip/hapus/ganti minimum). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const s = Array.from(a)
  const t = Array.from(b)
  if (s.length === 0) return t.length
  if (t.length === 0) return s.length
  let prev = Array.from({ length: t.length + 1 }, (_, i) => i)
  for (let i = 1; i <= s.length; i++) {
    const cur = [i]
    for (let j = 1; j <= t.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[t.length]
}

/** Toleransi typo: ≤ 1 untuk jawaban ≤ 6 huruf, ≤ 2 untuk yang lebih panjang. */
export function typoTolerance(expected: string): number {
  return Array.from(expected).length <= 6 ? 1 : 2
}

export function isCloseEnough(input: string, expected: string): boolean {
  const a = normalizeAnswer(input)
  const b = normalizeAnswer(expected)
  if (!b) return false
  return levenshtein(a, b) <= typoTolerance(b)
}

/**
 * Periksa jawaban Typing. Jika ada beberapa jawaban (cloze ganda), pengguna boleh
 * mengetik semuanya dipisah koma/titik koma, atau satu kalimat gabungan.
 */
export function checkTyping(input: string, expected: readonly string[]): boolean {
  if (expected.length === 0) return false
  if (expected.length === 1) return isCloseEnough(input, expected[0])
  const parts = input.split(/[,;]/).map((p) => p.trim()).filter(Boolean)
  if (parts.length === expected.length && parts.every((p, i) => isCloseEnough(p, expected[i]))) return true
  return isCloseEnough(input, expected.join(', ')) || isCloseEnough(input, expected.join(' '))
}
