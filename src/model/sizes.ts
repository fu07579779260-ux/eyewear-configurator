import type { EyewearConfig } from './config'

// Standard optical sizing: most frames carry a code such as 52□18-145 inside a
// temple (lens width □ bridge - temple length). The configurator lets users set
// the total frame width instead, so the two are converted here.

/** How far each end piece (with its hinge pocket) reaches beyond the rim: room for the frame hinge leaf. Placeholder, PLAN.md §4.6. */
export const END_PIECE = 7

/** Lens widths outside this range get a warning (PLAN.md §4.2). */
export const LENS_WIDTH_RANGE = { min: 44, max: 58 } as const

/** Total width = two lenses + bridge + two rims and end pieces. */
export function lensWidthFor(frameWidth: number, bridge: number, rimWidth: number): number {
  return (frameWidth - bridge - 2 * (rimWidth + END_PIECE)) / 2
}

export function frameWidthFor(lensWidth: number, bridge: number, rimWidth: number): number {
  return 2 * lensWidth + bridge + 2 * (rimWidth + END_PIECE)
}

const round1 = (n: number) => Math.round(n * 10) / 10
/** Show whole numbers without a decimal, others with one. */
const show = (n: number) => String(round1(n))

export interface DerivedSizes {
  lensWidth: number
  lensWidthOk: boolean
  /** e.g. "50.5□18-145" */
  sizeCode: string
}

export function derivedSizes(config: EyewearConfig): DerivedSizes {
  const { frameWidth, bridge, rimWidth, templeLength } = config.fit
  const lensWidth = round1(lensWidthFor(frameWidth, bridge, rimWidth))
  return {
    lensWidth,
    lensWidthOk: lensWidth >= LENS_WIDTH_RANGE.min && lensWidth <= LENS_WIDTH_RANGE.max,
    sizeCode: `${show(lensWidth)}□${show(bridge)}-${show(templeLength)}`,
  }
}

export interface GlassesMeasurement {
  lensWidth: number
  bridge: number
  templeLength: number
}

export type MeasurementResult =
  | { ok: true; value: GlassesMeasurement }
  | { ok: false; error: 'unreadable' | 'out-of-range' }

// Plausible values for real glasses. Wider than the configurator ranges so
// that unusual sizes are read and then clamped, not rejected.
const PLAUSIBLE = {
  lensWidth: [38, 64],
  bridge: [10, 28],
  templeLength: [115, 165],
} as const

/**
 * Read the size code printed inside a temple. Accepts the usual ways it is
 * written: "52□18-145", "52-18-145", "52 18 145", "52/18/145", "52口18 145",
 * "52[]18-145", with or without decimals.
 */
export function parseSizeCode(input: string): MeasurementResult {
  const numbers = input.match(/\d+(?:[.,]\d+)?/g)?.map((n) => Number(n.replace(',', '.')))
  if (!numbers || numbers.length !== 3) return { ok: false, error: 'unreadable' }
  const [lensWidth, bridge, templeLength] = numbers
  const value = { lensWidth, bridge, templeLength }
  for (const key of Object.keys(PLAUSIBLE) as (keyof typeof PLAUSIBLE)[]) {
    const [min, max] = PLAUSIBLE[key]
    if (value[key] < min || value[key] > max) return { ok: false, error: 'out-of-range' }
  }
  return { ok: true, value }
}
