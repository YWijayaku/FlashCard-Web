import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useReminderCheck } from '@/hooks/useReminder'
import { useApplyTheme } from '@/hooks/useTheme'
import { ensureInitialized } from '@/lib/seed'
import BrowserPage from '@/pages/Browser'
import DeckDetailPage from '@/pages/DeckDetail'
import DecksPage from '@/pages/Decks'
import HomePage from '@/pages/Home'
import ImportPage from '@/pages/Import'
import NotFoundPage from '@/pages/NotFound'
import SettingsPage from '@/pages/Settings'
import StatsPage from '@/pages/Stats'
import StudyPage from '@/pages/Study'
import { AppShell } from './AppShell'

export function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string>()
  useApplyTheme()

  useEffect(() => {
    ensureInitialized()
      .then(() => setReady(true))
      .catch(() => setError('Penyimpanan browser (IndexedDB) tidak tersedia. Coba nonaktifkan mode privat.'))
  }, [])

  if (error) return <p className="p-6 text-center text-destructive">{error}</p>
  if (!ready) return null
  return <Ready />
}

function Ready() {
  useReminderCheck()

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/decks/:deckId/study" element={<StudyPage />} />
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="decks" element={<DecksPage />} />
          <Route path="decks/:deckId" element={<DeckDetailPage />} />
          <Route path="browser" element={<BrowserPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
