import { ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { GUIDE } from '@/content/guide'
import { INSPIRATION } from '@/content/inspiration'
import { useLanguage, useT } from '@/i18n/language'
import { asset } from '@/lib/asset'
import { href } from '@/lib/router'

export function InspirationPage() {
  const t = useT()
  const { lang } = useLanguage()
  const content = INSPIRATION[lang]

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <PageHeader kicker={t('inspiration.kicker')} title={t('inspiration.title')} lead={t('inspiration.lead')} />

      <h2 className="kicker mt-12">{t('inspiration.concepts')}</h2>
      <ul className="mt-4 space-y-6">
        {content.concepts.map((c, i) => (
          <li key={c.file} className="panel grid overflow-hidden md:grid-cols-[1.4fr_1fr]">
            <img
              src={asset(`concept/${c.file}`)}
              alt={c.title}
              width={1600}
              height={900}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="aspect-video size-full object-cover"
            />
            <div className="space-y-3 p-5 sm:p-6">
              <h3 className="text-xl font-bold">{c.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{c.shows}</p>
              <p className="rounded-xl bg-canvas p-3 text-sm leading-relaxed text-ink ring-1 ring-rule">
                <span className="font-semibold text-sage">{t('inspiration.used')} </span>
                {c.used}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{t('inspiration.conceptNote')}</p>

      <h2 className="kicker mt-14">{t('inspiration.cases')}</h2>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {content.cases.map((c) => (
          <li key={c.title} className="panel flex flex-col gap-3 p-5">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">{c.kind}</p>
            <h3 className="text-lg leading-snug font-bold">{c.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{c.summary}</p>
            <p className="text-sm leading-relaxed text-ink">
              <span className="font-semibold text-sage">{t('inspiration.used')} </span>
              {c.used}
            </p>
            {c.notUsed && (
              <p className="text-sm leading-relaxed text-ink">
                <span className="font-semibold text-muted">{t('inspiration.notUsed')} </span>
                {c.notUsed}
              </p>
            )}
            {c.link && (
              <a
                href={c.link}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-sage underline-offset-2 hover:underline"
              >
                {t('inspiration.read')}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function GuidePage() {
  const t = useT()
  const { lang } = useLanguage()
  const sections = GUIDE[lang]

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <PageHeader kicker={t('guide.kicker')} title={t('guide.title')} lead={t('guide.lead')} />

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1fr]">
        {/* Contents: sideways on phones, a sticky list on wide screens */}
        <nav aria-label={t('guide.contents')} className="lg:sticky lg:top-32 lg:self-start">
          <ol className="scroll-row -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            {sections.map((s, i) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#/guide`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(`guide-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm whitespace-nowrap text-ink ring-1 ring-rule hover:bg-soft lg:rounded-lg lg:bg-transparent lg:ring-0"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-soft text-xs font-semibold text-sage tabular-nums">
                    {i + 1}
                  </span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-5">
          {sections.map((s, i) => (
            <article key={s.id} id={`guide-${s.id}`} className="panel scroll-mt-32 p-5 sm:p-6">
              <p className="kicker">{`${t('guide.step')} ${i + 1}`}</p>
              <h2 className="mt-1 text-2xl font-bold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.intro}</p>
              <ol className="mt-4 space-y-2.5">
                {s.steps.map((step, k) => (
                  <li key={k} className="flex gap-3 text-sm leading-relaxed text-ink">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-soft text-[0.7rem] font-semibold text-sage tabular-nums">
                      {k + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              {s.note && <p className="mt-4 rounded-xl bg-canvas p-3 text-xs leading-relaxed text-muted ring-1 ring-rule">{s.note}</p>}
            </article>
          ))}
          <Button asChild size="lg" className="rounded-full">
            <a href={href('/configure')}>{t('home.start')}</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
