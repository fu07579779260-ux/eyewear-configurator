import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FrameSketch } from '@/components/layout/FrameSketch'
import { Button } from '@/components/ui/button'
import { STEP_DESCRIPTION, STEP_LABEL, STEP_TITLE, STEPS } from '@/configure/steps'
import { fill, useT } from '@/i18n/language'
import { cn } from '@/lib/utils'

/**
 * Configurator layout: the six-step rail on top, the preview as the main
 * area and the step panel beside it (desktop) or below it (phone).
 * The step contents and the 3D viewport are filled in by later build steps.
 */
export function ConfigurePage() {
  const t = useT()
  const [active, setActive] = useState(0)
  const navRef = useRef<HTMLOListElement>(null)
  const step = STEPS[active]

  // On phones the step row scrolls sideways: keep the current step in view
  useEffect(() => {
    // Scrolls only the row sideways, never the page
    const row = navRef.current
    const item = row?.querySelector<HTMLElement>('[aria-current="step"]')?.parentElement
    if (!row || !item) return
    const left = item.offsetLeft - (row.clientWidth - item.offsetWidth) / 2
    row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [active])
  const last = active === STEPS.length - 1

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
      <h1 className="sr-only">{t('configure.title')}</h1>

      <nav aria-label={t('wizard.nav')}>
        {/* Scrolls sideways on phones, six equal columns on wider screens */}
        <ol ref={navRef} className="-mx-4 flex gap-1.5 scroll-row overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-6 md:px-0">
          {STEPS.map((id, index) => (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-current={index === active ? 'step' : undefined}
                className={cn(
                  'flex min-h-11 w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm whitespace-nowrap transition-colors',
                  index === active
                    ? 'bg-sage font-semibold text-primary-foreground'
                    : 'bg-surface/80 text-muted ring-1 ring-rule hover:bg-surface hover:text-ink',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums',
                    index === active ? 'bg-primary-foreground/20' : 'bg-soft text-sage',
                  )}
                >
                  {index < active ? <Check className="size-3.5" /> : index + 1}
                </span>
                {t(STEP_LABEL[id])}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <section
          aria-label={t('viewport.label')}
          className="panel nylon relative flex h-[42dvh] min-h-64 items-center justify-center overflow-hidden lg:sticky lg:top-32 lg:h-[calc(100dvh-10.5rem)] lg:min-h-[30rem] lg:flex-1"
        >
          {/* Warm studio backdrop with a soft floor shadow under the glasses */}
          <div
            aria-hidden="true"
            className="absolute inset-x-[15%] bottom-[22%] h-6 rounded-[50%] bg-ink/10 blur-xl"
          />
          <FrameSketch className="relative w-[72%] max-w-md" />
          <p className="absolute bottom-3 left-4 text-xs text-muted">{t('viewport.placeholder')}</p>
        </section>

        <aside aria-label={t('panel.label')} className="panel flex flex-col lg:w-[24rem] lg:shrink-0">
          <div className="space-y-2 p-5">
            <p className="kicker">{fill(t('wizard.step'), { current: String(active + 1), total: String(STEPS.length) })}</p>
            <h2 className="text-xl font-bold">{t(STEP_TITLE[step])}</h2>
            <p className="text-sm leading-relaxed text-muted">{t(STEP_DESCRIPTION[step])}</p>
          </div>

          <div className="mx-5 rounded-xl border border-dashed border-rule bg-canvas/60 p-4 text-sm text-muted">
            {t('panel.placeholder')}
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 border-t border-rule p-4">
            <Button
              variant="ghost"
              className="rounded-full"
              disabled={active === 0}
              onClick={() => setActive(active - 1)}
            >
              <ArrowLeft />
              {t('wizard.previous')}
            </Button>
            {!last && (
              <Button className="rounded-full" onClick={() => setActive(active + 1)}>
                {fill(t('wizard.next'), { name: t(STEP_LABEL[STEPS[active + 1]]) })}
                <ArrowRight />
              </Button>
            )}
          </div>
          <p className="px-5 pb-4 text-xs text-muted">{t('wizard.keep')}</p>
        </aside>
      </div>
    </div>
  )
}
