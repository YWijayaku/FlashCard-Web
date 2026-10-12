import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { SessionSummary } from './SessionSummary'
import type { StudyQueue } from './useStudyQueue'

/** Tampilan loading / kosong / selesai yang sama untuk semua mode SRS. */
export function SessionGate({ session, onExit, children }: { session: StudyQueue; onExit: () => void; children: ReactNode }) {
  if (session.status === 'loading') return null
  if (session.status === 'empty') {
    return (
      <div className="m-auto max-w-sm px-4 text-center">
        <p className="text-lg font-semibold">Tidak ada kartu untuk dipelajari saat ini.</p>
        <p className="mt-1 text-sm text-muted-foreground">Semua kartu due sudah selesai atau kuota kartu baru habis.</p>
        <Button className="mt-6" onClick={onExit}>
          Kembali
        </Button>
      </div>
    )
  }
  if (session.status === 'done' || !session.current) {
    return <SessionSummary studied={session.studied} correct={session.correct} onExit={onExit} />
  }
  return <>{children}</>
}

/** Area kartu (scroll) + zona jempol di bawah. */
export function SessionBody({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <>
      <div className="flex flex-1 items-center overflow-y-auto px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">{children}</div>
      </div>
      <div className="border-t bg-background px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-2xl">{footer}</div>
      </div>
    </>
  )
}
