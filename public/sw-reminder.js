/* Dimuat oleh service worker Workbox (importScripts). Tanpa backend:
 * Periodic Background Sync membuka IndexedDB lokal dan menampilkan pengingat
 * jika ada kartu jatuh tempo, sudah lewat jam pengingat, dan belum diingatkan hari ini. */
const REMINDER_TAG = 'due-reminder'
const META_CACHE = 'flashcard-meta'

function dayKey(d) {
  const p = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('flashcard')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function checkAndNotify() {
  const db = await openDb()
  try {
    if (!db.objectStoreNames.contains('settings')) return
    const tx = db.transaction(['settings', 'cardStates'], 'readonly')
    const settings = await request(tx.objectStore('settings').get('app'))
    if (!settings || !settings.notificationsEnabled) return
    const now = new Date()
    const [h, m] = String(settings.reminderTime || '19:00').split(':').map(Number)
    const at = new Date(now)
    at.setHours(h || 0, m || 0, 0, 0)
    if (now < at) return
    const count = await request(tx.objectStore('cardStates').index('due').count(IDBKeyRange.upperBound(now.getTime())))
    if (!count) return
    const cache = await caches.open(META_CACHE)
    const last = await cache.match('last-notified')
    const today = dayKey(now)
    if (last && (await last.text()) === today) return
    await cache.put('last-notified', new Response(today))
    await self.registration.showNotification('Waktunya belajar!', {
      body: 'Ada kartu yang menunggu untuk dipelajari hari ini.',
      icon: 'pwa-192x192.png',
      tag: REMINDER_TAG,
    })
  } finally {
    db.close()
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === REMINDER_TAG) event.waitUntil(checkAndNotify())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) if ('focus' in client) return client.focus()
      return self.clients.openWindow(self.registration.scope)
    }),
  )
})
