import type { EyewearConfig } from '@/model/config'
import { derivedSizes, LENS_WIDTH_RANGE } from '@/model/sizes'
import { GROOVE_DEPTH, GROOVE_WIDTH } from './front'
import { EAR_BEND } from './temple'
import { EDGE_MARGIN, INNER_SKIN, SLS } from './texture'

// Print checks (PLAN.md §5, §9 step 12): the design measured against the
// SLS PA12 rules. They are warnings, not blocks: each has a short reason and
// a fix. Hard limits (minimum wall, hole size, strut) are already built into
// the slider ranges and the geometry; these checks catch the combinations
// that print poorly or not at all.

/** Thinnest line that engraves crisply in SLS PA12 (PLAN.md §5). */
export const MIN_LINE = 0.5
/** Smallest letter height whose strokes reach MIN_LINE in a bold font. */
export const MIN_TEXT_SIZE = 2.5
/** Build volume of a typical small SLS printer (e.g. 165 × 165 × 300 mm): longest part that fits flat. */
export const BED_LENGTH = 160
/** Room the organic pockets need across the temple to be worth cutting. */
const MIN_POCKET_ROOM = 2.5

export type CheckId =
  | 'lensWidth'
  | 'rimWall'
  | 'frontWall'
  | 'ribs'
  | 'pockets'
  | 'textSize'
  | 'pocketSkin'
  | 'bed'

export interface Check {
  id: CheckId
  ok: boolean
  /** Numbers for the message, already formatted */
  values: Record<string, string>
}

const mm = (n: number) => n.toFixed(1)

export function printChecks(config: EyewearConfig): Check[] {
  const { fit, texture, personal } = config
  const sizes = derivedSizes(config)
  const checks: Check[] = []

  checks.push({
    id: 'lensWidth',
    ok: sizes.lensWidthOk,
    values: { width: mm(sizes.lensWidth), min: String(LENS_WIDTH_RANGE.min), max: String(LENS_WIDTH_RANGE.max) },
  })

  // Material left behind the lens groove, in the rim and through the frame thickness
  const rimWall = fit.rimWidth - GROOVE_DEPTH
  checks.push({ id: 'rimWall', ok: rimWall >= SLS.minWall * 2, values: { wall: mm(rimWall), min: mm(SLS.minWall * 2) } })
  const frontWall = (fit.frontThickness - GROOVE_WIDTH) / 2
  checks.push({ id: 'frontWall', ok: frontWall >= SLS.minWall, values: { wall: mm(frontWall), min: mm(SLS.minWall) } })

  if (texture.type === 'ribbed') {
    const groove = texture.ribPitch * 0.45
    checks.push({
      id: 'ribs',
      ok: groove >= MIN_LINE,
      values: { groove: groove.toFixed(2), min: MIN_LINE.toFixed(1), pitch: mm(Math.ceil((MIN_LINE / 0.45) * 10) / 10) },
    })
  }
  if (texture.type === 'perforated') {
    const room = fit.templeWidth - 2 * EDGE_MARGIN
    checks.push({ id: 'pockets', ok: room >= MIN_POCKET_ROOM, values: { room: mm(room), min: mm(MIN_POCKET_ROOM + 2 * EDGE_MARGIN) } })
  }

  const engraved = personal.inscription.trim() !== ''
  if (engraved) {
    checks.push({ id: 'textSize', ok: personal.textSize >= MIN_TEXT_SIZE, values: { size: mm(personal.textSize), min: mm(MIN_TEXT_SIZE) } })
  }
  if (texture.type === 'perforated' && (engraved || personal.designNumber)) {
    // The pockets are made shallower over the engraving; report the wall that is left
    checks.push({ id: 'pocketSkin', ok: INNER_SKIN >= SLS.minWall, values: { wall: mm(INNER_SKIN) } })
  }

  // The longest printed parts must fit the printer lying flat
  const longest = Math.max(fit.frameWidth, fit.templeLength - EAR_BEND * 0.2)
  checks.push({ id: 'bed', ok: longest <= BED_LENGTH, values: { length: mm(longest), max: String(BED_LENGTH) } })

  return checks
}

/** Only the checks that need attention. */
export const printWarnings = (config: EyewearConfig) => printChecks(config).filter((c) => !c.ok)

