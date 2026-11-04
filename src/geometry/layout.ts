import type { EyewearConfig } from '@/model/config'
import { END_PIECE, lensWidthFor } from '@/model/sizes'
import { lensOutline, lensSpec, upperEdgeAt, type Outline } from './lens'

// Where the parts of the glasses sit, worked out from the fit dimensions and
// the lens outline. Plain maths without three.js, so the panel (print checks,
// engraving layout, guide) can use it without loading the 3D library.
//
// Scene units are millimetres. X runs across the face (+X is the wearer's
// left, seen from the front on the right), Y is up with Y = 0 at the lens
// centres, and +Z points forward out of the face. The front frame sits
// between Z = -frontThickness and Z = 0; the temples run back along -Z.

/** Rounded edge on the front frame. */
export const FRONT_BEVEL = 0.6

export interface StandInLayout {
  lensWidth: number
  lensHeight: number
  /** The right lens outline, centred on (0, 0) */
  outline: Outline
  /** X of the right lens centre (the left one is mirrored) */
  lensCentreX: number
  /** X of the outer edge of the right rim */
  rimOuterX: number
  /** X of the right hinge, the outer end of the front frame */
  hingeX: number
  /** Y of the end pieces and hinges, near the top outer corner of the rim */
  hingeY: number
  /** Y of the bridge, near the top inner corner of the rim */
  bridgeY: number
  /** Lowest point of the frame, where it rests on the table */
  bottomY: number
}

export function standInLayout(config: EyewearConfig): StandInLayout {
  const { frameWidth, bridge, rimWidth, lensHeight } = config.fit
  const lensWidth = lensWidthFor(frameWidth, bridge, rimWidth)
  const outline = lensOutline(lensSpec(config, lensWidth))
  // The end piece meets the rim just inside its outer top corner, the bridge
  // just inside its inner top corner; both sit a little below the rim's top edge
  const hingeY = upperEdgeAt(outline, lensWidth / 2 - Math.min(6, lensWidth * 0.12)) - rimWidth * 0.1
  const bridgeY = upperEdgeAt(outline, -lensWidth / 2 + Math.min(7, lensWidth * 0.14)) - rimWidth * 0.2
  return {
    lensWidth,
    lensHeight,
    outline,
    lensCentreX: bridge / 2 + lensWidth / 2,
    rimOuterX: bridge / 2 + lensWidth + rimWidth,
    hingeX: bridge / 2 + lensWidth + rimWidth + END_PIECE,
    hingeY: Math.min(hingeY, lensHeight / 2),
    bridgeY: Math.min(bridgeY, lensHeight / 2),
    bottomY: -(lensHeight / 2 + rimWidth),
  }
}

