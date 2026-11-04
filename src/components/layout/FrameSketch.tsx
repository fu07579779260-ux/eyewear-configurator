// Front view of a pair of rounded-square glasses, drawn flat in the dye colours.
// Stands in for the 3D preview until the viewport is built.
export function FrameSketch({
  frame = 'var(--dye-sand)',
  temple = 'var(--dye-sage)',
  className,
}: {
  frame?: string
  temple?: string
  className?: string
}) {
  return (
    <svg viewBox="0 0 320 130" className={className} aria-hidden="true">
      {/* temples, seen folded behind the front */}
      <path d="M22 44 L4 40" stroke={temple} strokeWidth="7" strokeLinecap="round" />
      <path d="M298 44 L316 40" stroke={temple} strokeWidth="7" strokeLinecap="round" />
      {/* lenses */}
      <g fill="#ffffff" fillOpacity="0.45">
        <rect x="32" y="30" width="108" height="78" rx="30" />
        <rect x="180" y="30" width="108" height="78" rx="30" />
      </g>
      {/* rims and bridge */}
      <g fill="none" stroke={frame} strokeWidth="11" strokeLinejoin="round">
        <rect x="32" y="30" width="108" height="78" rx="30" />
        <rect x="180" y="30" width="108" height="78" rx="30" />
        <path d="M140 52 C150 38 170 38 180 52" strokeLinecap="round" />
      </g>
      {/* hinges */}
      <g fill="#a9a39a">
        <rect x="18" y="38" width="10" height="12" rx="2" />
        <rect x="292" y="38" width="10" height="12" rx="2" />
      </g>
    </svg>
  )
}
