import { lensOutline, type LensSpec } from '@/geometry/lens'

const toPath = (points: readonly (readonly [number, number])[], dx: number, flip: boolean) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${(dx + (flip ? -x : x)).toFixed(2)},${(-y).toFixed(2)}`).join('') + 'Z'

/** A front view of both lenses drawn from the real outline, for the shape cards. */
export function LensPairIcon({ spec, bridge = 16, className }: { spec: LensSpec; bridge?: number; className?: string }) {
  const outline = lensOutline(spec, 96)
  const cx = bridge / 2 + spec.width / 2
  const pad = 4
  const w = 2 * spec.width + bridge + 2 * pad
  const h = spec.height + 2 * pad
  return (
    <svg viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} className={className} aria-hidden="true">
      <g fill="color-mix(in oklab, var(--surface) 60%, transparent)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path d={toPath(outline, cx, false)} />
        <path d={toPath(outline, -cx, true)} />
      </g>
      <path
        d={`M${-bridge / 2 - 1},${-spec.height * 0.28} Q0,${-spec.height * 0.42} ${bridge / 2 + 1},${-spec.height * 0.28}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
