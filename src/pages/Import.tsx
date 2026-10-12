import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Upload } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CopyPromptButton } from '@/features/import/CopyPromptButton'
import { ImportPreview } from '@/features/import/ImportPreview'
import { deckNameFromFile, detectFormat, parseImport, validRows } from '@/features/import/parse'
import { db } from '@/lib/db'
import { bulkCreateCards, createDeck, DEFAULT_NEW_PER_DAY } from '@/lib/store'
import { DECK_COLORS } from '@/lib/themes'

const NEW_DECK = '__new__'
const selectClass =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm'

export default function ImportPage() {
  const navigate = useNavigate()
  const decks = useLiveQuery(() => db.decks.orderBy('name').toArray(), [])
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [target, setTarget] = useState(NEW_DECK)
  const [deckName, setDeckName] = useState('')
  const [saving, setSaving] = useState(false)

  const format = detectFormat(text, fileName)
  const result = useMemo(() => (text.trim() ? parseImport(text, format, deckNameFromFile(fileName)) : undefined), [text, format, fileName])
  const data = result?.ok ? result.data : undefined
  const name = deckName || data?.deck || ''
  const ready = data ? validRows(data.rows) : []
  const canSave = ready.length > 0 && (target !== NEW_DECK || name.trim() !== '') && !saving

  async function readFile(file: File | undefined) {
    if (!file) return
    setFileName(file.name)
    setDeckName('')
    setText(await file.text())
  }

  async function save() {
    if (!data || !canSave) return
    setSaving(true)
    try {
      const deckId =
        target === NEW_DECK
          ? (
              await createDeck({
                name: name.trim(),
                description: data.description,
                color: DECK_COLORS[(decks?.length ?? 0) % DECK_COLORS.length],
                icon: '📥',
                theme: '',
                newPerDay: DEFAULT_NEW_PER_DAY,
              })
            ).id
          : target
      await bulkCreateCards(deckId, ready)
      navigate(`/decks/${deckId}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Import" description="Impor kartu dari file JSON atau CSV." actions={<CopyPromptButton />} />
      <div className="space-y-5">
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <Label htmlFor="import-file" className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center hover:bg-accent">
            <Upload className="h-6 w-6" aria-hidden />
            <span>{fileName || 'Pilih file .json atau .csv'}</span>
          </Label>
          <input id="import-file" type="file" accept=".json,.csv,application/json,text/csv" className="sr-only" onChange={(e) => void readFile(e.target.files?.[0])} />
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">…atau tempel teks</summary>
            <Textarea
              className="mt-2 font-mono text-xs"
              rows={6}
              value={text}
              aria-label="Teks JSON atau CSV"
              placeholder={'front,back,third\n水,air,みず (mizu)'}
              onChange={(e) => {
                setFileName('')
                setText(e.target.value)
              }}
            />
          </details>
          <p className="text-xs text-muted-foreground">
            JSON: {'{ "deck", "description"?, "cards": [{ "front", "back", "third"? }] }'} · CSV: header wajib <code>front,back,third</code>
          </p>
        </section>

        {result && !result.ok && (
          <p role="alert" className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {result.error}
          </p>
        )}

        {data && (
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="import-target">Simpan ke</Label>
                <select id="import-target" className={selectClass} value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value={NEW_DECK}>Deck baru</option>
                  {decks?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              {target === NEW_DECK && (
                <div className="space-y-2">
                  <Label htmlFor="import-name">Nama deck baru *</Label>
                  <Input id="import-name" value={name} onChange={(e) => setDeckName(e.target.value)} />
                </div>
              )}
            </div>
            <ImportPreview rows={data.rows} />
            <Button size="lg" className="w-full sm:w-auto" disabled={!canSave} onClick={() => void save()}>
              Impor {ready.length} kartu
            </Button>
          </section>
        )}
      </div>
    </>
  )
}
