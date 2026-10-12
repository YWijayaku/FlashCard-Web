import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FlashcardDB } from '@/lib/db'
import { ensureInitialized } from '@/lib/seed'
import { createDeck } from '@/lib/store'
import { backupFileName, blobToDataUrl, dataUrlToBlob, exportBackup, parseBackup, restoreBackup } from './backup'

let database: FlashcardDB
beforeEach(async () => {
  database = new FlashcardDB(`backup-${crypto.randomUUID()}`)
  await database.open()
})
afterEach(async () => {
  await database.delete()
})

const deckInput = { name: 'Lain', description: '', color: '#000', icon: '', theme: '', newPerDay: 20 }

describe('backup', () => {
  it('blob ↔ data URL bolak-balik', async () => {
    const blob = new Blob([new Uint8Array([0, 1, 2, 250, 255])], { type: 'image/webp' })
    const url = await blobToDataUrl(blob)
    expect(url.startsWith('data:image/webp;base64,')).toBe(true)
    const back = dataUrlToBlob(url)
    expect(back.type).toBe('image/webp')
    expect(await blobToDataUrl(back)).toBe(url)
    expect(back.size).toBe(5)
  })

  it('export → JSON → parse → restore "ganti semua"', async () => {
    await ensureInitialized(database, 1000)
    const file = await exportBackup(database, 2000)
    expect(file).toMatchObject({ version: 1, exportedAt: 2000 })
    const parsed = parseBackup(JSON.stringify(file))
    if (!parsed.ok) throw new Error(parsed.error)

    await createDeck(deckInput, 3000, database)
    await restoreBackup(database, parsed.backup, 'replace')
    expect(await database.decks.count()).toBe(file.data.decks.length)
    expect(await database.cards.count()).toBe(file.data.cards.length)
    expect(await database.settings.count()).toBe(1)
  })

  it('restore "gabungkan" mempertahankan data yang ada', async () => {
    await ensureInitialized(database, 1000)
    const file = await exportBackup(database)
    await database.delete()
    database = new FlashcardDB(`backup-${crypto.randomUUID()}`)
    await createDeck(deckInput, 3000, database)
    await database.settings.put({ id: 'app', theme: 'dark', reminderTime: '07:00', notificationsEnabled: true })
    await restoreBackup(database, file, 'merge')
    expect(await database.decks.count()).toBe(2)
    expect((await database.settings.get('app'))?.theme).toBe('dark')
    // restore dua kali tidak menggandakan data
    await restoreBackup(database, file, 'merge')
    expect(await database.decks.count()).toBe(2)
  })

  it('menolak file yang bukan backup', () => {
    expect(parseBackup('xx').ok).toBe(false)
    expect(parseBackup('{"deck":"x"}').ok).toBe(false)
    expect(parseBackup('{"version":99,"data":{}}').ok).toBe(false)
    expect(parseBackup('{"version":1,"data":{"decks":{}}}').ok).toBe(false)
    expect(parseBackup('{"version":1,"data":{"decks":[{"name":"x"}]}}').ok).toBe(false)
    expect(parseBackup('{"version":1,"data":{}}').ok).toBe(true)
  })

  it('nama file berisi tanggal', () => {
    expect(backupFileName(new Date(2026, 0, 5).getTime())).toBe('flashcard-backup-2026-01-05.json')
  })
})
