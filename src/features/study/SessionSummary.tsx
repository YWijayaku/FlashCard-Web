import { Button } from '@/components/ui/button'

interface SessionSummaryProps {
  studied: number
  correct: number
  onExit: () => void
}

export function SessionSummary({ studied, correct, onExit }: SessionSummaryProps) {
  const accuracy = studied > 0 ? Math.round((correct / studied) * 100) : 0
  return (
    <div className="m-auto w-full max-w-sm px-4 text-center">
      <p className="text-4xl" aria-hidden>
        🎉
      </p>
      <h2 className="mt-2 text-xl font-bold">Sesi selesai!</h2>
      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Kartu dinilai</dt>
          <dd className="text-2xl font-bold">{studied}</dd>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Hafal</dt>
          <dd className="text-2xl font-bold">{accuracy}%</dd>
        </div>
      </dl>
      <Button size="lg" className="mt-6 w-full" onClick={onExit} autoFocus>
        Selesai
      </Button>
    </div>
  )
}
