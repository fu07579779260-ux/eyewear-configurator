import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/language'
import type { StringKey } from '@/i18n/strings'
import { href } from '@/lib/router'

export function HomePage() {
  const t = useT()
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <p className="kicker">{t('home.kicker')}</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">{t('home.title')}</h1>
      <p className="mt-5 max-w-xl text-lg text-muted">{t('home.lead')}</p>
      <p className="mt-6 text-sm font-semibold text-sage">{t('home.flow')}</p>
      <Button asChild size="lg" className="mt-8 rounded-full">
        <a href={href('/configure')}>{t('home.start')}</a>
      </Button>
    </section>
  )
}

function Placeholder({ title }: { title: StringKey }) {
  const t = useT()
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">{t(title)}</h1>
      <p className="mt-3 text-muted">{t('page.comingSoon')}</p>
    </section>
  )
}

export const ConfigurePage = () => <Placeholder title="configure.title" />
export const InspirationPage = () => <Placeholder title="inspiration.title" />
export const GuidePage = () => <Placeholder title="guide.title" />
export const MyDesignsPage = () => <Placeholder title="myDesigns.title" />
