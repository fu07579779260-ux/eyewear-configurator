import type { EyewearConfig } from '@/model/config'
import { standInLayout } from './layout'

// The standard temple connection (PLAN.md §4.6, §5): every frame and every
// temple gets the same hinge pockets, so any temple fits any frame.
//
// It is built around a standard 3-barrel screw hinge for plastic frames.
// Each hinge has two flat leaves: one sits in a pocket in the back of the
// frame's end piece, the other in a pocket on the inside of the temple. Each
// leaf is held by one M1.4 self-tapping screw; an M1.4 pivot screw runs down
// through the barrels. The values are placeholders until the bought hinges
// are measured (PLAN.md §9 step 17).
//
// Geometry (right side, temples open, coordinates as in standin.ts):
// - the temple's outer face is flush with the outer end of the frame;
// - the pivot axis is vertical, in the inside corner between the back of the
//   frame and the inside of the temple, so a folded temple lies flat behind
//   the frame, as on real glasses.

export const HINGE = {
  /** Leaf length, from the barrel along the part */
  leafLength: 4.5,
  /** Leaf height (Y) */
  leafHeight: 2.8,
  leafThickness: 1,
  barrelDiameter: 2.2,
  /** The pivot axis sits this far behind the frame and inside the temple */
  axisInset: 0.8,
  /** Gap between the front end of the temple and the back of the frame */
  gap: 0.3,
  /** Extra room around each leaf in its pocket (SLS PA12 clearance) */
  pocketClearance: 0.15,
  /** Pilot hole for the M1.4 self-tapping leaf screw */
  pilotDiameter: 1.15,
  /** How deep the pilot hole reaches past the bottom of the pocket */
  pilotDepth: 1.5,
  /** Temples can't be folded further than this (degrees) */
  foldMax: 90,
} as const

/** Temple thickness (across the face when the temples are open). */
export const TEMPLE_THICKNESS = 3.5

export interface HingeLayout {
  /** Pivot axis, right side (X, Z); Y is the hinge height */
  axisX: number
  axisZ: number
  y: number
  /** Frame leaf pocket in the back of the end piece, right side: X range */
  framePocketX: [number, number]
  /** Inner face of the right temple when open (X) */
  templeInnerX: number
  /** Front end of the temple when open (Z) */
  templeFrontZ: number
  /** Temple leaf pocket, measured along the temple from its front end */
  templePocketU: [number, number]
}

export function hingeLayout(config: EyewearConfig): HingeLayout {
  const l = standInLayout(config)
  const t = config.fit.frontThickness
  const templeInnerX = l.hingeX - TEMPLE_THICKNESS
  const axisX = templeInnerX - HINGE.axisInset
  const axisZ = -t - HINGE.axisInset
  const templeFrontZ = -t - HINGE.gap
  // Leaves start just past their barrel and run away from the pivot
  const start = HINGE.barrelDiameter / 2 - 0.2
  // Distance from the temple's front end back to the pivot axis
  const axisU = templeFrontZ - axisZ
  return {
    axisX,
    axisZ,
    y: l.hingeY,
    framePocketX: [axisX - start - HINGE.leafLength, axisX - start],
    templeInnerX,
    templeFrontZ,
    templePocketU: [axisU + start, axisU + start + HINGE.leafLength],
  }
}
