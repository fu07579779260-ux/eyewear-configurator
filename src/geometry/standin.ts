import { ExtrudeGeometry, Shape, type BufferGeometry } from 'three'
import type { EyewearConfig } from '@/model/config'
import { END_PIECE, lensWidthFor } from '@/model/sizes'

// A simple stand-in pair of glasses, built from the fit dimensions so the
// viewport, lighting and materials can be checked (PLAN.md §9 step 4).
// Build steps 5–7 replace it with the real lens outlines, front frame,
// temples and hinges.
//
// Scene units are millimetres. X runs across the face (+X is the wearer's
// left, seen from the front on the right), Y is up with Y = 0 at the lens
// centres, and +Z points forward out of the face. The front frame sits
// between Z = -frontThickness and Z = 0; the temples run back along -Z.

/** Temple thickness (across X). Placeholder until the temple step. */
export const TEMPLE_THICKNESS = 3.2
/** Where the temple starts to bend down behind the ear, from its tip. */
const EAR_BEND = 32
/** How far the temple tip drops below the hinge. */
const EAR_DROP = 20

export interface StandInLayout {
  lensWidth: number
  lensHeight: number
  /** X of the right lens centre (the left one is mirrored) */
  lensCentreX: number
  /** X of the outer edge of the right rim */
  rimOuterX: number
  /** X of the right hinge, the outer end of the front frame */
  hingeX: number
  /** Y of the bridge and the hinges */
  hingeY: number
  /** Lowest point of the frame, where it rests on the table */
  bottomY: number
}

export function standInLayout(config: EyewearConfig): StandInLayout {
  const { frameWidth, bridge, rimWidth, lensHeight } = config.fit
  const lensWidth = lensWidthFor(frameWidth, bridge, rimWidth)
  return {
    lensWidth,
    lensHeight,
    lensCentreX: bridge / 2 + lensWidth / 2,
    rimOuterX: bridge / 2 + lensWidth + rimWidth,
    hingeX: bridge / 2 + lensWidth + rimWidth + END_PIECE,
    hingeY: lensHeight * 0.22,
    bottomY: -(lensHeight / 2 + rimWidth),
  }
}

/** Corner radius of the lens outline for each shape. */
function cornerRadius(config: EyewearConfig, w: number, h: number): number {
  const max = Math.min(w, h) / 2
  if (config.shape.frame === 'round') return max
  if (config.shape.frame === 'catEye') return Math.min(max, 12)
  return Math.min(max, config.shape.cornerRadius)
}

function roundedRect(shape: Shape, cx: number, cy: number, w: number, h: number, r: number, hole = false) {
  const x0 = cx - w / 2
  const y0 = cy - h / 2
  const x1 = cx + w / 2
  const y1 = cy + h / 2
  // Counter-clockwise for the outline, clockwise for holes
  const pts: [number, number, number, number, number][] = hole
    ? [
        [x0 + r, y0 + r, Math.PI, Math.PI * 1.5, 0],
        [x0 + r, y1 - r, Math.PI * 0.5, Math.PI, 0],
        [x1 - r, y1 - r, 0, Math.PI * 0.5, 0],
        [x1 - r, y0 + r, Math.PI * 1.5, Math.PI * 2, 0],
      ]
    : [
        [x1 - r, y0 + r, Math.PI * 1.5, Math.PI * 2, 0],
        [x1 - r, y1 - r, 0, Math.PI * 0.5, 0],
        [x0 + r, y1 - r, Math.PI * 0.5, Math.PI, 0],
        [x0 + r, y0 + r, Math.PI, Math.PI * 1.5, 0],
      ]
  for (const [ax, ay, start, end] of pts) {
    if (hole) shape.absarc(ax, ay, r, end, start, true)
    else shape.absarc(ax, ay, r, start, end, false)
  }
  shape.closePath()
  return shape
}

/** A flat band of constant width along a 2D centre line, as a closed shape. */
export function bandShape(points: [number, number][], halfWidth: number): Shape {
  const normals = points.map((_, i) => {
    const [ax, ay] = points[Math.max(0, i - 1)]
    const [bx, by] = points[Math.min(points.length - 1, i + 1)]
    const len = Math.hypot(bx - ax, by - ay) || 1
    return [-(by - ay) / len, (bx - ax) / len] as const
  })
  const left = points.map(([x, y], i) => [x + normals[i][0] * halfWidth, y + normals[i][1] * halfWidth] as const)
  const right = points.map(([x, y], i) => [x - normals[i][0] * halfWidth, y - normals[i][1] * halfWidth] as const)
  const outline = [...left, ...right.reverse()]
  const shape = new Shape()
  shape.moveTo(outline[0][0], outline[0][1])
  for (const [x, y] of outline.slice(1)) shape.lineTo(x, y)
  shape.closePath()
  return shape
}

const extrude = (shape: Shape, depth: number, bevel: number) =>
  new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 24,
  })

export interface StandInParts {
  /** Right rim; the left one is the same geometry mirrored in X */
  rim: BufferGeometry
  lens: BufferGeometry
  bridge: BufferGeometry
  /** Right end piece, from the rim out to the hinge */
  endPiece: BufferGeometry
  /** Right temple in its own frame: length along local +X, thickness along local +Z */
  temple: BufferGeometry
}

export function buildStandIn(config: EyewearConfig): StandInParts {
  const { rimWidth, frontThickness, templeLength, templeWidth, bridge } = config.fit
  const l = standInLayout(config)
  const r = cornerRadius(config, l.lensWidth, l.lensHeight)
  const bevel = 0.6
  const bodyDepth = frontThickness - 2 * bevel

  const rimShape = roundedRect(new Shape(), l.lensCentreX, 0, l.lensWidth + 2 * rimWidth, l.lensHeight + 2 * rimWidth, r + rimWidth)
  rimShape.holes.push(roundedRect(new Shape(), l.lensCentreX, 0, l.lensWidth, l.lensHeight, r, true))
  const rim = extrude(rimShape, bodyDepth, bevel)

  const lens = extrude(roundedRect(new Shape(), l.lensCentreX, 0, l.lensWidth + 1, l.lensHeight + 1, r + 0.5), 1.6, 0)

  // A shallow arch between the two rims, overlapping them a little
  const reach = bridge / 2 + rimWidth * 0.6
  const arch: [number, number][] = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16
    return [-reach + 2 * reach * t, l.hingeY + 3.5 * Math.sin(Math.PI * t)]
  })
  const bridgeGeom = extrude(bandShape(arch, rimWidth * 0.5), bodyDepth, bevel)

  const endPiece = extrude(
    bandShape(
      [
        [l.rimOuterX - rimWidth, l.hingeY],
        [l.hingeX, l.hingeY],
      ],
      rimWidth * 0.62,
    ),
    bodyDepth,
    bevel,
  )

  // Temple side profile: straight back from the hinge, then down behind the ear
  const straight = templeLength - EAR_BEND
  const centre: [number, number][] = [
    [0, 0],
    [straight, 0],
  ]
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2)
    centre.push([straight + EAR_BEND * 0.8 * Math.sin(a), -EAR_DROP * (1 - Math.cos(a))])
  }
  const temple = extrude(bandShape(centre, templeWidth / 2), TEMPLE_THICKNESS - 1, 0.5)

  return { rim, lens, bridge: bridgeGeom, endPiece, temple }
}

export function disposeStandIn(parts: StandInParts) {
  for (const geometry of Object.values(parts)) geometry.dispose()
}
