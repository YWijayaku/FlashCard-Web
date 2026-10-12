import { PageHeader } from '@/components/PageHeader'
import { BackupSection } from '@/features/backup/BackupSection'
import { AppearanceSection } from '@/features/settings/AppearanceSection'
import { ReminderSection } from '@/features/settings/ReminderSection'

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Pengaturan" />
      <div className="space-y-4">
        <AppearanceSection />
        <ReminderSection />
        <BackupSection />
        <p className="text-center text-xs text-muted-foreground">Flashcard v{__APP_VERSION__} · semua data tersimpan di perangkat ini</p>
      </div>
    </>
  )
}
