import type { ReactNode } from 'react'

/** Kicker, title and lead at the top of a content page. */
export function PageHeader({ kicker, title, lead }: { kicker: string; title: string; lead?: ReactNode }) {
  return (
    <header className="max-w-2xl">
      <p className="kicker">{kicker}</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
      {lead && <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{lead}</p>}
    </header>
  )
}
