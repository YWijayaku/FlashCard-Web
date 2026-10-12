import type { CSSProperties } from 'react'

export interface ThemePreset {
  id: string
  label: string
  /** Nilai HSL tanpa `hsl()` untuk variabel --primary/--ring. */
  primary: string
}

export const THEME_PRESETS: readonly ThemePreset[] = [
  { id: 'indigo', label: 'Indigo', primary: '243 75% 59%' },
  { id: 'emerald', label: 'Hijau', primary: '160 84% 32%' },
  { id: 'rose', label: 'Mawar', primary: '346 77% 50%' },
  { id: 'amber', label: 'Jingga', primary: '25 95% 45%' },
  { id: 'sky', label: 'Biru langit', primary: '200 98% 36%' },
]

export const DECK_COLORS: readonly string[] = ['#4f46e5', '#059669', '#e11d48', '#d97706', '#0284c7', '#7c3aed', '#475569']

/** Gaya CSS untuk menerapkan tema deck (kosong = ikut tema aplikasi). */
export function deckThemeStyle(themeId: string): CSSProperties | undefined {
  const preset = THEME_PRESETS.find((t) => t.id === themeId)
  if (!preset) return undefined
  return { '--primary': preset.primary, '--ring': preset.primary } as CSSProperties
}
