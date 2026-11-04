import { Check, FilePlus2, FolderOpen, Link2, Save } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { captureJpegDataUrl } from '@/export/capture'
import { fill, useT } from '@/i18n/language'
import { href } from '@/lib/router'
import { useDesign } from '@/model/design-context'
import { buildShareUrl, parseDesignFile } from '@/model/serialize'
import { MAX_NAME_LENGTH } from '@/persistence/designs'
import { library, useSavedDesigns } from '@/persistence/library'
import { openDesign, useOpenDesign } from '@/persistence/working'

type Status =
  | { kind: 'idle' }
  | { kind: 'saved' | 'updated' | 'copied' | 'opened' }
  | { kind: 'error'; message: 'save' | 'copy' | 'invalid-json' | 'not-a-design' | 'newer-version' }

/** Small picture of the glasses for the My designs page. */
const thumbnail = () => captureJpegDataUrl(480, 320)

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers or blocked clipboard: copy from a hidden text field
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

/** Save the design in this browser, share it as a link, or open a design file. */
export function SavePanel() {
  const t = useT()
  const { config, load } = useDesign()
  const designs = useSavedDesigns()
  const openId = useOpenDesign()
  const open = designs.find((d) => d.id === openId) ?? null
  const fallbackName = fill(t('sheet.name'), { shape: t(`shape.${config.shape.frame}`) })
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const fileInput = useRef<HTMLInputElement>(null)
  const id = useId()

  // Start from the open design's name
  useEffect(() => setName(open?.name ?? ''), [open?.id, open?.name])

  const act = async (fn: () => Promise<Status>) => {
    try {
      setStatus(await fn())
    } catch (error) {
      console.error(error)
      setStatus({ kind: 'error', message: 'save' })
    }
  }

  const saveNew = () =>
    act(async () => {
      const newId = await library.create(name, config, thumbnail(), fallbackName)
      openDesign.set(newId)
      return { kind: 'saved' }
    })

  const saveChanges = () =>
    act(async () => {
      if (!open) return { kind: 'idle' }
      if (name.trim() && name.trim() !== open.name) await library.rename(open.id, name)
      await library.update(open.id, config, thumbnail())
      return { kind: 'updated' }
    })

  const share = () =>
    act(async () => ((await copyText(buildShareUrl(config, window.location.href))) ? { kind: 'copied' } : { kind: 'error', message: 'copy' }))

  const openFile = async (file: File) => {
    const result = parseDesignFile(await file.text())
    if (!result.ok) {
      setStatus({ kind: 'error', message: result.error })
      return
    }
    load(result.config)
    openDesign.set(null)
    setStatus({ kind: 'opened' })
  }

  return (
    <section aria-labelledby="save-title" className="space-y-2">
      <h3 id="save-title" className="text-sm font-semibold text-ink">
        {t('save.title')}
      </h3>
      <div className="space-y-2.5 rounded-xl bg-canvas p-3.5 ring-1 ring-rule">
        {open && (
          <p className="text-xs text-muted">
            {fill(t('save.editing'), { name: open.name })}{' '}
            <a href={href('/my-designs')} className="font-semibold text-sage underline-offset-2 hover:underline">
              {t('nav.myDesigns')}
            </a>
          </p>
        )}
        <label htmlFor={id} className="sr-only">
          {t('save.name')}
        </label>
        <input
          id={id}
          type="text"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          placeholder={fallbackName}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-surface px-3 py-2 text-sm text-ink ring-1 ring-rule placeholder:text-muted/70 focus:ring-sage"
        />
        <div className="flex flex-wrap gap-2">
          {open && (
            <Button className="rounded-full" onClick={saveChanges}>
              <Save />
              {t('save.update')}
            </Button>
          )}
          <Button variant={open ? 'secondary' : 'default'} className="rounded-full" onClick={saveNew}>
            <FilePlus2 />
            {open ? t('save.asNew') : t('save.new')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="rounded-full" onClick={share}>
          {status.kind === 'copied' ? <Check /> : <Link2 />}
          {t('save.share')}
        </Button>
        <Button variant="secondary" className="rounded-full" onClick={() => fileInput.current?.click()}>
          <FolderOpen />
          {t('save.openFile')}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void openFile(file)
            e.target.value = ''
          }}
        />
      </div>

      <p role="status" className="min-h-4 text-xs">
        {status.kind === 'error' ? (
          <span className="text-warn">{t(`save.error.${status.message}`)}</span>
        ) : status.kind !== 'idle' ? (
          <span className="text-sage">{t(`save.done.${status.kind}`)}</span>
        ) : null}
      </p>
      {/* When the clipboard is blocked, show the link so it can be copied by hand */}
      {status.kind === 'error' && status.message === 'copy' && (
        <input
          type="text"
          readOnly
          aria-label={t('save.share')}
          value={buildShareUrl(config, window.location.href)}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg bg-surface px-3 py-2 text-xs text-ink ring-1 ring-rule"
        />
      )}
      <p className="text-xs leading-relaxed text-muted">{t('save.local')}</p>
    </section>
  )
}
