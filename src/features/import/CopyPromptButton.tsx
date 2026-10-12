import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AI_IMPORT_PROMPT } from './aiPrompt'

export function CopyPromptButton() {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(AI_IMPORT_PROMPT)
      setCopied(true)
      setFailed(false)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setFailed(true)
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={() => void copy()}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? 'Tersalin!' : 'Copy prompt untuk AI'}
      </Button>
      {failed && (
        <textarea readOnly className="h-40 w-full rounded-md border bg-muted p-2 text-xs" value={AI_IMPORT_PROMPT} aria-label="Prompt untuk AI" />
      )}
    </div>
  )
}
