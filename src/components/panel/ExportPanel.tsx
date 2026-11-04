import { Download, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { downloadFile } from '@/export/download'
import type { ExportFormat } from '@/export/exporters'
import { useLanguage, useT } from '@/i18n/language'
import type { StringKey } from '@/i18n/strings'
import { useDesign } from '@/model/design-context'
import { useMarks } from '@/personal/use-marks'

const FILES: { format: ExportFormat; label: StringKey; hint: StringKey }[] = [
  { format: 'pdf', label: 'export.pdf', hint: 'export.pdf.hint' },
  { format: 'stl-front', label: 'export.stlFront', hint: 'export.stl.hint' },
  { format: 'stl-temples', label: 'export.stlTemples', hint: 'export.stl.hint' },
  { format: '3mf', label: 'export.3mf', hint: 'export.3mf.hint' },
  { format: 'lens', label: 'export.lens', hint: 'export.lens.hint' },
  { format: '3dm', label: 'export.3dm', hint: 'export.3dm.hint' },
  { format: 'png', label: 'export.png', hint: 'export.png.hint' },
  { format: 'json', label: 'export.json', hint: 'export.json.hint' },
]

/** Downloads for the confirmed design: the full production set first, then single files. */
export function ExportPanel() {
  const t = useT()
  const { lang } = useLanguage()
  const { config } = useDesign()
  const marks = useMarks(config)
  const [busy, setBusy] = useState<ExportFormat | null>(null)
  const [failed, setFailed] = useState(false)

  const run = async (format: ExportFormat) => {
    setBusy(format)
    setFailed(false)
    try {
      // The exporters (and the geometry kernel) load only when a file is asked for
      const { exportDesign } = await import('@/export/exporters')
      const file = await exportDesign(format, config, marks, lang)
      downloadFile(file.data, file.name, file.type)
    } catch (error) {
      console.error('Export failed', error)
      setFailed(true)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section aria-labelledby="export-title" className="space-y-2">
      <h3 id="export-title" className="text-sm font-semibold text-ink">
        {t('export.title')}
      </h3>
      <Button className="h-auto w-full flex-col items-start gap-0.5 rounded-xl px-4 py-3 text-left" disabled={busy !== null} onClick={() => run('zip')}>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {busy === 'zip' ? <LoaderCircle className="animate-spin" /> : <Download />}
          {t('export.zip')}
        </span>
        <span className="text-xs font-normal whitespace-normal opacity-85">{t('export.zip.hint')}</span>
      </Button>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
        {FILES.map((f) => (
          <li key={f.format}>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => run(f.format)}
              className="flex w-full items-start gap-2 rounded-lg bg-canvas px-3 py-2 text-left ring-1 ring-rule transition-colors hover:bg-soft disabled:opacity-60"
            >
              {busy === f.format ? (
                <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-sage" aria-hidden="true" />
              ) : (
                <Download className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{t(f.label)}</span>
                <span className="block text-xs leading-snug text-muted">{t(f.hint)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p role="status" className="min-h-4 text-xs text-warn">
        {failed && t('export.failed')}
      </p>
    </section>
  )
}
