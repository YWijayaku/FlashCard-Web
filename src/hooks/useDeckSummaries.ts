import { useLiveQuery } from 'dexie-react-hooks'
import { loadDeckSummaries, type DeckSummary } from '@/lib/store'

/** Ringkasan due/baru per deck; diperbarui otomatis saat data berubah. */
export function useDeckSummaries(): DeckSummary[] | undefined {
  return useLiveQuery(() => loadDeckSummaries(Date.now()), [])
}
