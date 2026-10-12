import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { Section } from '@/features/settings/Section'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { db } from '@/lib/db'
import { backupFileName, exportBackup, parseBackup, restoreBackup, type BackupFile, type RestoreMode } from './backup'

function download(content: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function BackupSection() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string }>()
  const [pending, setPending] = useState<BackupFile>()

  async function handleExport() {
    setBusy(true)
    try {
      const file = await exportBackup(db)
      download(JSON.stringify(file), backupFileName())
      setMessage({ ok: true, text: `Backup dibuat: ${file.data.decks.length} deck, ${file.data.cards.length} kartu.` })
    } catch {
      setMessage({ ok: false, text: 'Gagal membuat backup.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    const result = parseBackup(await file.text())
    if (result.ok) setPending(result.backup)
    else setMessage({ ok: false, text: result.error })
  }

  async function restore(mode: RestoreMode) {
    if (!pending) return
    setBusy(true)
    try {
      await restoreBackup(db, pending, mode)
      setMessage({ ok: true, text: mode === 'replace' ? 'Data berhasil dipulihkan (ganti semua).' : 'Data berhasil digabungkan.' })
    } catch {
      setMessage({ ok: false, text: 'Restore gagal. Data lama tidak diubah.' })
    } finally {
      setBusy(false)
      setPending(undefined)
    }
  }

  return (
    <Section title="Backup & Restore" description="Simpan seluruh data (termasuk gambar) ke satu file JSON, atau pulihkan dari file backup.">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handleExport()} disabled={busy}>
          <Download aria-hidden />
          Export backup
        </Button>
        <Button variant="outline" asChild>
          <label className="cursor-pointer">
            <Upload aria-hidden />
            Restore dari file
            <input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = '' }} />
          </label>
        </Button>
      </div>
      {message && (
        <p role="status" className={message.ok ? 'text-sm text-emerald-700 dark:text-emerald-400' : 'text-sm text-destructive'}>
          {message.text}
        </p>
      )}
      <Dialog open={pending !== undefined} onOpenChange={(open) => !open && setPending(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore backup?</DialogTitle>
            <DialogDescription>
              File berisi {pending?.data.decks.length ?? 0} deck dan {pending?.data.cards.length ?? 0} kartu
              {pending?.exportedAt ? `, dibuat ${new Date(pending.exportedAt).toLocaleString('id-ID')}` : ''}.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Ganti semua</strong>: hapus semua data saat ini lalu pakai isi backup.</li>
            <li><strong className="text-foreground">Gabungkan</strong>: tambahkan isi backup; data dengan ID sama ditimpa.</li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(undefined)}>Batal</Button>
            <Button variant="secondary" disabled={busy} onClick={() => void restore('merge')}>Gabungkan</Button>
            <Button variant="destructive" disabled={busy} onClick={() => void restore('replace')}>Ganti semua</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  )
}
