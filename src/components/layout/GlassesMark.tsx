// Small line drawing of a pair of glasses, used as the app mark
export function GlassesMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--soft)" />
      <g fill="none" stroke="var(--sage)" strokeWidth="2.2" strokeLinecap="round">
        <rect x="3.5" y="11" width="10.5" height="9" rx="4" />
        <rect x="18" y="11" width="10.5" height="9" rx="4" />
        <path d="M14 14.5c1.2-1.4 2.8-1.4 4 0" />
      </g>
    </svg>
  )
}
