import { useLiveQuery } from 'dexie-react-hooks'
import type { Settings } from '@/types'
import { db, DEFAULT_SETTINGS, type FlashcardDB } from './db'

export async function getSettings(database: FlashcardDB = db): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await database.settings.get('app')) }
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>, database: FlashcardDB = db): Promise<void> {
  const current = await getSettings(database)
  await database.settings.put({ ...current, ...patch, id: 'app' })
}

/** Pengaturan aplikasi (live); default selama memuat. */
export function useSettings(): Settings {
  return useLiveQuery(() => getSettings(), []) ?? DEFAULT_SETTINGS
}
