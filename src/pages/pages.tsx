import { FrameSketch } from '@/components/layout/FrameSketch'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { STEP_LABEL, STEPS } from '@/configure/steps'
import { useT } from '@/i18n/language'
import type { StringKey } from '@/i18n/strings'
import { href } from '@/lib/router'

export { ConfigurePage } from './ConfigurePage'

// Five dye colours shown as frame / temple pairs on the home page
const PAIRS = [
  ['var(--dye-sand)', 'var(--dye-sage)'],
  ['var(--dye-burgundy)', 'var(--dye-burgundy)'],
  ['var(--dye-navy)', 'var(--dye-sand)'],
  ['var(--dye-charcoal)', 'var(--dye-burgundy)'],
  ['var(--dye-sage)', 'var(--dye-charcoal)'],
] as const

const PARTS: { title: StringKey; body: StringKey }[] = [
  { title: 'home.part.frame.title', body: 'home.part.frame.body' },
  { title: 'home.part.temples.title', body: 'home.part.temples.body' },
  { title: 'home.part.standard.title', body: 'home.part.standard.body' },
]

export function HomePage() {
  const t = useT()
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid items-center gap-10 py-12 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="kicker">{t('home.kicker')}</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">{t('home.title')}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{t('home.lead')}</p>
          <Button asChild size="lg" className="mt-8 rounded-full">
            <a href={href('/configure')}>{t('home.start')}</a>
          </Button>
        </div>
        <div className="panel nylon p-6 sm:p-8" aria-label={t('home.palette')} role="img">
          <FrameSketch className="mx-auto w-11/12" />
          <div className="mt-6 grid grid-cols-5 gap-2 border-t border-rule pt-5">
            {PAIRS.slice(1).concat([PAIRS[0]]).map(([frame, temple]) => (
              <FrameSketch key={frame + temple} frame={frame} temple={temple} />
            ))}
          </div>
        </div>
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

      <section aria-labelledby="parts-title" className="py-10">
        <h2 id="parts-title" className="kicker">{t('home.partsTitle')}</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {PARTS.map((p) => (
            <li key={p.title} className="panel p-5">
              <h3 className="text-lg font-bold">{t(p.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(p.body)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function ComingPage({ kicker, title, lead }: { kicker: StringKey; title: StringKey; lead: StringKey }) {
  const t = useT()
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <PageHeader kicker={t(kicker)} title={t(title)} lead={t(lead)} />
      <p className="panel mt-8 max-w-2xl p-5 text-sm text-muted">{t('page.comingSoon')}</p>
    </section>
  )
}

export const InspirationPage = () => (
  <ComingPage kicker="inspiration.kicker" title="inspiration.title" lead="inspiration.lead" />
)
export const GuidePage = () => <ComingPage kicker="guide.kicker" title="guide.title" lead="guide.lead" />
export const MyDesignsPage = () => (
  <ComingPage kicker="myDesigns.kicker" title="myDesigns.title" lead="myDesigns.lead" />
)
