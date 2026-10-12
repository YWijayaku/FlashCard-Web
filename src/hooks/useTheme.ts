import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { ThemeMode } from '@/types'

/** Terapkan kelas `dark` pada <html> sesuai pengaturan (default ikut sistem). */
export function useApplyTheme(): void {
  const mode: ThemeMode = useLiveQuery(() => db.settings.get('app'), [])?.theme ?? 'system'

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [mode])
}
