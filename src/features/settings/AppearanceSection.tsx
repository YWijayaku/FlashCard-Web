import { Monitor, Moon, Sun } from 'lucide-react'
import { updateSettings, useSettings } from '@/lib/settings'
import { THEME_PRESETS } from '@/lib/themes'
import { cn } from '@/lib/utils'
import type { ThemeMode } from '@/types'
import { Section } from './Section'

const MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistem', icon: Monitor },
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'dark', label: 'Gelap', icon: Moon },
]

export function AppearanceSection() {
  const settings = useSettings()
  const accent = settings.accent ?? ''

  return (
    <Section title="Tampilan" description="Tema mengikuti sistem secara default. Deck bisa memiliki tema sendiri.">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Mode</legend>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={settings.theme === value}
              onClick={() => void updateSettings({ theme: value })}
              className={cn(
                'flex min-h-touch flex-col items-center justify-center gap-1 rounded-md border py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                settings.theme === value ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Warna utama</legend>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((t, i) => {
            const active = accent === t.id || (accent === '' && i === 0)
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                aria-label={t.label}
                title={t.label}
                onClick={() => void updateSettings({ accent: i === 0 ? '' : t.id })}
                className={cn(
                  'h-11 w-11 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  active ? 'border-foreground' : 'border-transparent',
                )}
                style={{ backgroundColor: `hsl(${t.primary})` }}
              />
            )
          })}
        </div>
      </fieldset>
    </Section>
  )
}
