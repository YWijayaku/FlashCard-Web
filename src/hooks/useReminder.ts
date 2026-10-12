import { useEffect } from 'react'
import { loadDeckSummaries } from '@/lib/store'
import { getSettings } from '@/lib/settings'
import {
  localDayKey,
  notificationPermission,
  readLastNotified,
  setAppBadge,
  shouldNotify,
  showReminderNotification,
  writeLastNotified,
} from '@/lib/notify'

/** Saat app dibuka / kembali aktif: perbarui badge dan tampilkan notifikasi bila perlu. */
export function useReminderCheck(): void {
  useEffect(() => {
    let running = false
    async function check() {
      if (running || document.visibilityState !== 'visible') return
      running = true
      try {
        const now = Date.now()
        const [settings, summaries, lastNotifiedDay] = await Promise.all([getSettings(), loadDeckSummaries(now), readLastNotified()])
        const pendingCount = summaries.reduce((n, s) => n + s.due + s.fresh, 0)
        setAppBadge(pendingCount)
        const input = {
          enabled: settings.notificationsEnabled,
          permission: notificationPermission(),
          pendingCount,
          reminderTime: settings.reminderTime,
          lastNotifiedDay,
          now,
        }
        if (shouldNotify(input)) {
          await writeLastNotified(localDayKey(now))
          await showReminderNotification(pendingCount)
        }
      } catch {
        // notifikasi bersifat opsional
      } finally {
        running = false
      }
    }
    void check()
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [])
}
