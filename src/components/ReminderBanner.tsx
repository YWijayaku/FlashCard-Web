import { BellRing } from 'lucide-react'
import { notificationPermission, shouldShowBanner } from '@/lib/notify'
import { useSettings } from '@/lib/settings'

/** Fallback pengingat di dalam app saat notifikasi tidak aktif/diizinkan. */
export function ReminderBanner({ pendingCount }: { pendingCount: number }) {
  const settings = useSettings()
  const notifying = settings.notificationsEnabled && notificationPermission() === 'granted'
  if (notifying || !shouldShowBanner(pendingCount, settings.reminderTime, Date.now())) return null
  return (
    <div role="status" className="mb-4 flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
      <BellRing className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <span>
        <strong>Waktunya belajar!</strong> {pendingCount} kartu menunggu hari ini.
      </span>
    </div>
  )
}
