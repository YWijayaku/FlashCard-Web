import { startOfLocalDay } from './queue'

/** Kunci hari lokal "YYYY-MM-DD". */
export function localDayKey(now: number): string {
  const d = new Date(now)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Waktu pengingat hari ini (epoch ms) dari "HH:mm"; format salah → 19:00. */
export function reminderAt(reminderTime: string, now: number): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(reminderTime)
  const h = m ? Math.min(23, Number(m[1])) : 19
  const min = m ? Math.min(59, Number(m[2])) : 0
  const d = new Date(startOfLocalDay(now))
  d.setHours(h, min, 0, 0)
  return d.getTime()
}

export interface ReminderInput {
  enabled: boolean
  permission: NotificationPermission | 'unsupported'
  pendingCount: number
  reminderTime: string
  lastNotifiedDay: string | null
  now: number
}

/** Tampilkan notifikasi sistem: aktif, diizinkan, ada kartu, sudah lewat jam pengingat, belum hari ini. */
export function shouldNotify(input: ReminderInput): boolean {
  return (
    input.enabled &&
    input.permission === 'granted' &&
    input.pendingCount > 0 &&
    input.now >= reminderAt(input.reminderTime, input.now) &&
    input.lastNotifiedDay !== localDayKey(input.now)
  )
}

/** Banner di dalam app: ada kartu & sudah lewat jam pengingat (fallback tanpa notifikasi). */
export function shouldShowBanner(pendingCount: number, reminderTime: string, now: number): boolean {
  return pendingCount > 0 && now >= reminderAt(reminderTime, now)
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

// Disimpan di Cache API agar sama dengan service worker (public/sw-reminder.js).
const META_CACHE = 'flashcard-meta'
const LAST_KEY = 'last-notified'

export async function readLastNotified(): Promise<string | null> {
  try {
    const res = await (await caches.open(META_CACHE)).match(LAST_KEY)
    return res ? await res.text() : null
  } catch {
    return null
  }
}

export async function writeLastNotified(day: string): Promise<void> {
  try {
    await (await caches.open(META_CACHE)).put(LAST_KEY, new Response(day))
  } catch {
    // Cache API tidak tersedia; abaikan
  }
}

export async function showReminderNotification(count: number): Promise<void> {
  const title = 'Waktunya belajar!'
  const options: NotificationOptions = {
    body: `${count} kartu menunggu untuk dipelajari hari ini.`,
    icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
    badge: `${import.meta.env.BASE_URL}pwa-192x192.png`,
    tag: 'due-reminder',
  }
  const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
  if (reg) await reg.showNotification(title, options)
  else new Notification(title, options)
}

interface PeriodicSyncManager {
  register(tag: string, options: { minInterval: number }): Promise<void>
  unregister(tag: string): Promise<void>
}

export const PERIODIC_TAG = 'due-reminder'

/** Daftarkan Periodic Background Sync jika browser mendukung. true = berhasil. */
export async function setPeriodicReminder(enabled: boolean): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const reg = await navigator.serviceWorker.getRegistration()
  const sync = (reg as (ServiceWorkerRegistration & { periodicSync?: PeriodicSyncManager }) | undefined)?.periodicSync
  if (!sync) return false
  try {
    if (!enabled) {
      await sync.unregister(PERIODIC_TAG)
      return true
    }
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName })
    if (status.state !== 'granted') return false
    await sync.register(PERIODIC_TAG, { minInterval: 6 * 60 * 60 * 1000 })
    return true
  } catch {
    return false
  }
}

/** Badge angka di ikon aplikasi (jika didukung). */
export function setAppBadge(count: number): void {
  const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
  if (count > 0) void nav.setAppBadge?.(count).catch(() => undefined)
  else void nav.clearAppBadge?.().catch(() => undefined)
}
