import { ArrowRight } from 'lucide-react'
import { FrameSketch } from '@/components/layout/FrameSketch'
import { Button } from '@/components/ui/button'
import { STEP_LABEL, STEPS } from '@/configure/steps'
import { useT } from '@/i18n/language'
import type { StringKey } from '@/i18n/strings'
import { asset } from '@/lib/asset'
import { href } from '@/lib/router'

export { ConfigurePage } from './ConfigurePage'
export { GuidePage, InspirationPage } from './ContentPages'
export { MyDesignsPage } from './MyDesignsPage'

// Five dye colours shown as frame / temple pairs on the home page
const PAIRS = [
  ['var(--dye-burgundy)', 'var(--dye-burgundy)'],
  ['var(--dye-navy)', 'var(--dye-sand)'],
  ['var(--dye-charcoal)', 'var(--dye-burgundy)'],
  ['var(--dye-sage)', 'var(--dye-charcoal)'],
  ['var(--dye-sand)', 'var(--dye-sage)'],
] as const

const PARTS: { title: StringKey; body: StringKey }[] = [
  { title: 'home.part.frame.title', body: 'home.part.frame.body' },
  { title: 'home.part.temples.title', body: 'home.part.temples.body' },
  { title: 'home.part.standard.title', body: 'home.part.standard.body' },
]

/** From the design to the finished pair, as on the concept slide. */
const MAKING: StringKey[] = ['home.make.1', 'home.make.2', 'home.make.3', 'home.make.4', 'home.make.5', 'home.make.6']

export function HomePage() {
  const t = useT()
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="kicker">{t('home.kicker')}</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">{t('home.title')}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{t('home.lead')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <a href={href('/configure')}>{t('home.start')}</a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full">
              <a href={href('/guide')}>
                {t('home.howMade')}
                <ArrowRight />
              </a>
            </Button>
          </div>
        </div>
        <figure className="panel overflow-hidden">
          <img
            src={asset('concept/collection.jpg')}
            alt={t('home.heroAlt')}
            width={1600}
            height={900}
            className="aspect-video size-full object-cover"
          />
          {/* The five dye colours, as small frame and temple pairs */}
          <div className="nylon grid grid-cols-5 gap-2 px-5 py-4" aria-label={t('home.palette')} role="img">
            {PAIRS.map(([frame, temple]) => (
              <FrameSketch key={frame + temple} frame={frame} temple={temple} />
            ))}
          </div>
        </figure>
      </section>

      <section aria-labelledby="flow-title" className="py-6">
        <h2 id="flow-title" className="kicker">{t('home.flowTitle')}</h2>
        <ol className="mt-4 flex flex-wrap gap-2">
          {STEPS.map((id, index) => (
            <li key={id} className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-sm ring-1 ring-rule">
              <span className="flex size-6 items-center justify-center rounded-full bg-soft text-xs font-semibold text-sage tabular-nums">
                {index + 1}
              </span>
              {t(STEP_LABEL[id])}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="parts-title" className="grid items-center gap-8 py-12 lg:grid-cols-[1.15fr_1fr]">
        <img
          src={asset('concept/modular.jpg')}
          alt={t('home.modularAlt')}
          width={1600}
          height={900}
          loading="lazy"
          className="panel aspect-video w-full object-cover"
        />
        <div>
          <h2 id="parts-title" className="kicker">{t('home.partsTitle')}</h2>
          <ul className="mt-4 space-y-3">
            {PARTS.map((p) => (
              <li key={p.title} className="panel p-4">
                <h3 className="text-base font-bold">{t(p.title)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{t(p.body)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="make-title" className="py-6">
        <h2 id="make-title" className="kicker">{t('home.makeTitle')}</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MAKING.map((key, i) => (
            <li key={key} className="flex items-start gap-3 rounded-2xl bg-surface p-4 ring-1 ring-rule">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-primary-foreground tabular-nums">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-ink">{t(key)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid items-center gap-8 py-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t('home.phoneTitle')}</h2>
          <p className="mt-3 max-w-lg leading-relaxed text-muted">{t('home.phoneBody')}</p>
          <Button asChild size="lg" className="mt-6 rounded-full">
            <a href={href('/configure')}>{t('home.start')}</a>
          </Button>
        </div>
        <img
          src={asset('concept/configurator.jpg')}
          alt={t('home.phoneAlt')}
          width={1600}
          height={901}
          loading="lazy"
          className="panel aspect-video w-full object-cover"
        />
      </section>
    </div>
  )
}
