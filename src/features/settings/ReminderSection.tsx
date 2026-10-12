import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { notificationPermission, setPeriodicReminder } from '@/lib/notify'
import { updateSettings, useSettings } from '@/lib/settings'
import { Section } from './Section'

export function ReminderSection() {
  const settings = useSettings()
  const [permission, setPermission] = useState(notificationPermission)
  const [periodic, setPeriodic] = useState<boolean | null>(null)

  useEffect(() => {
    if (settings.notificationsEnabled) void setPeriodicReminder(true).then(setPeriodic)
  }, [settings.notificationsEnabled])

  async function toggle(enabled: boolean) {
    if (enabled && permission !== 'granted' && permission !== 'unsupported') {
      const result = await Notification.requestPermission()
      setPermission(result)
    }
    await updateSettings({ notificationsEnabled: enabled })
    setPeriodic(await setPeriodicReminder(enabled))
  }

  return (
    <Section title="Pengingat" description="Tanpa server: pengingat muncul saat aplikasi dibuka, lewat sinkronisasi latar belakang jika browser mendukung, atau sebagai banner di Beranda.">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="reminder-time">Jam pengingat harian</Label>
          <Input
            id="reminder-time"
            type="time"
            className="w-36"
            value={settings.reminderTime}
            onChange={(e) => e.target.value && void updateSettings({ reminderTime: e.target.value })}
          />
        </div>
        <label className="flex min-h-touch cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[hsl(var(--primary))]"
            checked={settings.notificationsEnabled}
            disabled={permission === 'unsupported'}
            onChange={(e) => void toggle(e.target.checked)}
          />
          <span className="text-sm font-medium">Notifikasi</span>
        </label>
      </div>
      <p className="text-sm text-muted-foreground" role="status">
        {permission === 'unsupported' && 'Browser ini tidak mendukung notifikasi; pengingat tampil sebagai banner di Beranda.'}
        {permission === 'denied' && 'Izin notifikasi ditolak. Aktifkan lewat pengaturan situs di browser; sementara itu pengingat tampil sebagai banner.'}
        {permission === 'granted' && settings.notificationsEnabled &&
          (periodic ? 'Aktif. Pengingat juga dicek di latar belakang secara berkala.' : 'Aktif. Notifikasi muncul saat aplikasi dibuka (sinkronisasi latar belakang tidak tersedia di browser ini).')}
        {permission === 'default' && !settings.notificationsEnabled && 'Aktifkan untuk meminta izin notifikasi.'}
      </p>
    </Section>
  )
}
