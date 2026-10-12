import { PageHeader } from './PageHeader'

export function Placeholder({ title, phase = 'fase berikutnya' }: { title: string; phase?: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Halaman ini akan dikerjakan pada {phase}.
      </div>
    </>
  )
}
