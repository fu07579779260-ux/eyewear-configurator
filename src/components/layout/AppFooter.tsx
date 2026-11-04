import { useT } from '@/i18n/language'

export function AppFooter() {
  const t = useT()

  return (
    <footer className="mt-20 border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-ink">{t('footer.tagline')}</p>
        <p className="text-muted">
          {t('footer.units')} · {t('footer.workshop')}
        </p>
      </div>
    </footer>
  )
}
