import { ExtrudeGeometry, Path, Shape, Vector2, type BufferGeometry } from 'three'
import type { EyewearConfig } from '@/model/config'
import { FRONT_BEVEL, standInLayout } from './layout'
import { offsetOutline, type Outline } from './lens'

// A simple pair of glasses built from the fit dimensions and the lens
// outlines (PLAN.md §9 steps 4–5). The rims and lenses already follow the
// real lens shapes; build steps 6–7 replace the bridge, end pieces, temples
// and hinges with printable parts.
//
// Coordinates as in layout.ts.

/** Temple thickness (across X). Placeholder until the temple step. */
export const TEMPLE_THICKNESS = 3.2
/** Where the temple starts to bend down behind the ear, from its tip. */
const EAR_BEND = 32
/** How far the temple tip drops below the hinge. */
const EAR_DROP = 20
const toVectors = (outline: Outline, dx: number) => outline.map(([x, y]) => new Vector2(x + dx, y))

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
  const bevel = FRONT_BEVEL
  const bodyDepth = frontThickness - 2 * bevel

  // Rim: the lens outline grown by the rim width (less the bevel, which adds it back), with the lens as a hole
  const rimShape = new Shape(toVectors(offsetOutline(l.outline, rimWidth - bevel), l.lensCentreX))
  rimShape.holes.push(new Path(toVectors(offsetOutline(l.outline, bevel), l.lensCentreX)))
  const rim = extrude(rimShape, bodyDepth, bevel)

  // The lens reaches a little into the rim, as it would sit in the lens groove
  const lens = extrude(new Shape(toVectors(offsetOutline(l.outline, 0.6), l.lensCentreX)), 1.6, 0)

  // A shallow arch between the two rims, overlapping them a little
  const reach = bridge / 2 + rimWidth * 0.8
  const arch: [number, number][] = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16
    return [-reach + 2 * reach * t, l.bridgeY + 3 * Math.sin(Math.PI * t)]
  })
  const bridgeGeom = extrude(bandShape(arch, rimWidth * 0.45), bodyDepth, bevel)

  const endPiece = extrude(
    bandShape(
      [
        [l.rimOuterX - rimWidth * 1.2, l.hingeY],
        [l.hingeX, l.hingeY],
      ],
      rimWidth * 0.6,
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
