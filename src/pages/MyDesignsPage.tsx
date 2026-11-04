import { Copy, Glasses, PencilLine, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { FrameSketch } from '@/components/layout/FrameSketch'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { fill, useLanguage, useT } from '@/i18n/language'
import { href } from '@/lib/router'
import { DYE_HEX, templeColour } from '@/model/config'
import { useDesign } from '@/model/design-context'
import { derivedSizes } from '@/model/sizes'
import { frameKey, type SavedDesign } from '@/persistence/designs'
import { library, useSavedDesigns } from '@/persistence/library'
import { openDesign, useOpenDesign } from '@/persistence/working'

/** Saved glasses (PLAN.md §7): reopen, duplicate, delete, and try new temples on a saved frame. */
export function MyDesignsPage() {
  const t = useT()
  const { lang } = useLanguage()
  const { load } = useDesign()
  const designs = useSavedDesigns()
  const openId = useOpenDesign()
  const [confirming, setConfirming] = useState<string | null>(null)

  // Designs that share a frame can swap temples: number the frames that appear more than once
  const counts = new Map<string, number>()
  for (const d of designs) counts.set(frameKey(d.config), (counts.get(frameKey(d.config)) ?? 0) + 1)
  const sharedFrames = [...counts.entries()].filter(([, n]) => n > 1).map(([key]) => key)

  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const openIn = (design: SavedDesign, step?: string, asNew = false) => {
    load(design.config)
    openDesign.set(asNew ? null : design.id)
    window.location.hash = step ? `#/configure?step=${step}` : '#/configure'
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <PageHeader kicker={t('myDesigns.kicker')} title={t('myDesigns.title')} lead={t('myDesigns.lead')} />

      {designs.length === 0 ? (
        <div className="panel nylon mt-8 flex max-w-2xl flex-col items-start gap-4 p-6">
          <FrameSketch className="w-48" />
          <p className="text-sm text-muted">{t('myDesigns.empty')}</p>
          <Button asChild className="rounded-full">
            <a href={href('/configure')}>{t('home.start')}</a>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((d) => {
            const shared = sharedFrames.indexOf(frameKey(d.config))
            return (
              <li key={d.id} className="panel flex flex-col overflow-hidden">
                <div className="nylon relative aspect-[3/2] bg-[#ece3d6]">
                  {d.thumbnail ? (
                    <img src={d.thumbnail} alt="" className="size-full object-cover" />
                  ) : (
                    <FrameSketch
                      frame={DYE_HEX[d.config.colour.frame]}
                      temple={DYE_HEX[templeColour(d.config)]}
                      className="absolute inset-0 m-auto w-3/4"
                    />
                  )}
                  {d.id === openId && (
                    <span className="absolute top-2 left-2 rounded-full bg-sage px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      {t('myDesigns.open')}
                    </span>
                  )}
                  {shared >= 0 && (
                    <span className="absolute top-2 right-2 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-ink ring-1 ring-rule">
                      {fill(t('myDesigns.sharedFrame'), { n: String.fromCharCode(65 + shared) })}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h2 className="truncate text-base font-bold">{d.name}</h2>
                  <p className="text-xs text-muted tabular-nums">
                    {derivedSizes(d.config).sizeCode} · {t(`colour.${d.config.colour.frame}`)} / {t(`colour.${templeColour(d.config)}`)} ·{' '}
                    {t(`texture.${d.config.texture.type}`)}
                  </p>
                  <p className="text-xs text-muted">{fill(t('myDesigns.saved'), { date: date(d.updatedAt) })}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button size="sm" className="rounded-full" onClick={() => openIn(d)}>
                      <PencilLine />
                      {t('myDesigns.edit')}
                    </Button>
                    <Button size="sm" variant="secondary" className="rounded-full" onClick={() => openIn(d, 'colours', true)}>
                      <Glasses />
                      {t('myDesigns.newTemples')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => void library.duplicate(d.id, (name) => fill(t('myDesigns.copyName'), { name }))}
                    >
                      <Copy />
                      {t('myDesigns.duplicate')}
                    </Button>
                    {confirming === d.id ? (
                      <span className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full"
                          onClick={() => {
                            if (openId === d.id) openDesign.set(null)
                            void library.remove(d.id)
                            setConfirming(null)
                          }}
                        >
                          {t('myDesigns.confirmDelete')}
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setConfirming(null)}>
                          {t('myDesigns.cancel')}
                        </Button>
                      </span>
                    ) : (
                      <Button size="sm" variant="ghost" className="rounded-full text-warn" onClick={() => setConfirming(d.id)}>
                        <Trash2 />
                        {t('myDesigns.delete')}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {sharedFrames.length > 0 && <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">{t('myDesigns.sharedNote')}</p>}
      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">{t('save.local')}</p>
    </section>
  )
}
