import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DECK_COLORS, THEME_PRESETS } from '@/lib/themes'
import { createDeck, DEFAULT_NEW_PER_DAY, updateDeck, type DeckInput } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Deck } from '@/types'

interface DeckFormProps {
  deck?: Deck
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (deckId: string) => void
}

const EMPTY: DeckInput = { name: '', description: '', color: DECK_COLORS[0], icon: '📘', theme: '', newPerDay: DEFAULT_NEW_PER_DAY }

function toInput(deck?: Deck): DeckInput {
  if (!deck) return EMPTY
  const { name, description, color, icon, theme, newPerDay } = deck
  return { name, description, color, icon, theme, newPerDay }
}

export function DeckForm({ deck, open, onOpenChange, onSaved }: DeckFormProps) {
  const [value, setValue] = useState<DeckInput>(() => toInput(deck))
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (open) {
      setValue(toInput(deck))
      setError(undefined)
    }
  }, [open, deck])

  const set = <K extends keyof DeckInput>(key: K, v: DeckInput[K]) => setValue((prev) => ({ ...prev, [key]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = value.name.trim()
    if (!name) {
      setError('Nama deck wajib diisi.')
      return
    }
    const input = { ...value, name, newPerDay: Math.max(0, Math.floor(value.newPerDay) || 0) }
    let id = deck?.id
    if (deck) await updateDeck(deck.id, input)
    else id = (await createDeck(input)).id
    onOpenChange(false)
    if (id) onSaved?.(id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{deck ? 'Edit deck' : 'Deck baru'}</DialogTitle>
          <DialogDescription>Atur nama, tampilan, dan batas kartu baru per hari.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[4.5rem_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="deck-icon">Ikon</Label>
              <Input id="deck-icon" value={value.icon} maxLength={4} className="text-center text-xl" onChange={(e) => set('icon', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deck-name">Nama *</Label>
              <Input id="deck-name" value={value.name} onChange={(e) => set('name', e.target.value)} autoFocus />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deck-desc">Deskripsi</Label>
            <Textarea id="deck-desc" value={value.description} rows={2} onChange={(e) => set('description', e.target.value)} />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Warna</legend>
            <div className="flex flex-wrap gap-2">
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Warna ${c}`}
                  aria-pressed={value.color === c}
                  onClick={() => set('color', c)}
                  className={cn(
                    'h-11 w-11 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    value.color === c ? 'border-foreground' : 'border-transparent',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="deck-theme">Tema</Label>
              <select
                id="deck-theme"
                value={value.theme}
                onChange={(e) => set('theme', e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              >
                <option value="">Ikut aplikasi</option>
                {THEME_PRESETS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deck-new">Kartu baru/hari</Label>
              <Input
                id="deck-new"
                type="number"
                inputMode="numeric"
                min={0}
                max={999}
                value={value.newPerDay}
                onChange={(e) => set('newPerDay', Number(e.target.value))}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
