import {
  DEFAULT_CONFIG,
  DYE_COLOURS,
  FRAME_SHAPES,
  MAX_INSCRIPTION_LENGTH,
  PLACEMENTS,
  RANGES,
  RIB_DIRECTIONS,
  TEMPLE_COLOURS,
  TEXTURES,
  type EyewearConfig,
  type NumberRange,
  type Section,
} from './config'

/** Clamp to the range and snap to its step (measured from min). */
export function clampToRange(value: number, r: NumberRange): number {
  const clamped = Math.min(r.max, Math.max(r.min, value))
  const snapped = r.min + Math.round((clamped - r.min) / r.step) * r.step
  // Remove float noise such as 1.2000000000000002
  return Math.min(r.max, Number(snapped.toFixed(6)))
}

const ENUMS: Partial<Record<string, readonly string[]>> = {
  'shape.frame': FRAME_SHAPES,
  'colour.frame': DYE_COLOURS,
  'colour.temple': TEMPLE_COLOURS,
  'texture.type': TEXTURES,
  'texture.ribDirection': RIB_DIRECTIONS,
  'personal.placement': PLACEMENTS,
}

/** Keep printable characters only, at most MAX_INSCRIPTION_LENGTH of them. */
export function cleanInscription(text: string): string {
  // eslint-disable-next-line no-control-regex
  const printable = text.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ')
  return Array.from(printable).slice(0, MAX_INSCRIPTION_LENGTH).join('')
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Turn any input (a loaded file, a share link, a partial update) into a valid
 * design. Missing or invalid fields fall back to the defaults, numbers are
 * clamped to their ranges, and unknown fields are dropped.
 */
export function sanitizeConfig(input: unknown): EyewearConfig {
  const source = isRecord(input) ? input : {}
  const result = structuredClone(DEFAULT_CONFIG)

  for (const section of Object.keys(DEFAULT_CONFIG) as Section[]) {
    const values = isRecord(source[section]) ? source[section] : {}
    const target = result[section] as unknown as Record<string, unknown>
    const ranges = (RANGES as Partial<Record<Section, Record<string, NumberRange>>>)[section] ?? {}

    for (const key of Object.keys(target)) {
      const value = values[key]
      const fallback = target[key]
      const options = ENUMS[`${section}.${key}`]
      if (options) {
        if (typeof value === 'string' && options.includes(value)) target[key] = value
      } else if (typeof fallback === 'number') {
        if (typeof value === 'number' && Number.isFinite(value)) target[key] = clampToRange(value, ranges[key])
      } else if (typeof fallback === 'boolean') {
        if (typeof value === 'boolean') target[key] = value
      } else if (typeof fallback === 'string') {
        if (typeof value === 'string') target[key] = value
      }
    }
  }

  result.personal.inscription = cleanInscription(result.personal.inscription)
  return result
}
