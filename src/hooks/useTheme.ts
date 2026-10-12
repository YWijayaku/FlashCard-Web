import { useEffect } from 'react'
import { useSettings } from '@/lib/settings'
import { THEME_PRESETS } from '@/lib/themes'

/** Terapkan kelas `dark` (default ikut sistem) dan preset warna aplikasi pada <html>. */
export function useApplyTheme(): void {
  const { theme: mode, accent } = useSettings()

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1120' : '#4f46e5')
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [mode])

  useEffect(() => {
    const preset = THEME_PRESETS.find((t) => t.id === accent)
    const style = document.documentElement.style
    if (preset) {
      style.setProperty('--primary', preset.primary)
      style.setProperty('--ring', preset.primary)
    } else {
      style.removeProperty('--primary')
      style.removeProperty('--ring')
    }
  }, [accent])
}
