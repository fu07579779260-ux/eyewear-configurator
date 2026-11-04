import type { CrossSection, Manifold } from 'manifold-3d'

// Helpers shared by the printed parts.

/** Keeps track of WASM objects so they can all be freed after building. */
export class Scratch {
  private items: { delete(): void }[] = []
  keep<T extends { delete(): void }>(item: T): T {
    this.items.push(item)
    return item
  }
  free() {
    for (const item of this.items) item.delete()
    this.items = []
  }
}

/** Steps used to approximate a rounded edge (each well under an SLS layer pair). */
const EDGE_STEPS = 4
/**
 * Each layer reaches a hair into its neighbour: solids that only touch along
 * a flat face would stay separate pieces after the union.
 */
const OVERLAP = 0.02

/**
 * Extrude a cross section to a slab from Z = 0 to Z = depth with rounded
 * edges on both faces: a stack of thin layers, each inset a little more
 * along a quarter circle of the given radius. The result is registered with
 * the scratch list, so the caller must not keep it again.
 */
export function roundedSlab(section: CrossSection, depth: number, radius: number, s: Scratch): Manifold {
  const r = Math.min(radius, depth / 3)
  let solid = s.keep(s.keep(section.extrude(depth - 2 * r)).translate([0, 0, r]))
  const step = r / EDGE_STEPS
  for (let k = 0; k < EDGE_STEPS; k++) {
    const z = (k + 0.5) * step // middle of this layer, measured from where the rounding starts
    const inset = r - Math.sqrt(r * r - z * z)
    const layer = s.keep(section.offset(-inset, 'Round'))
    const slab = s.keep(layer.extrude(step + OVERLAP))
    const top = s.keep(slab.translate([0, 0, depth - r + k * step - OVERLAP]))
    const bottom = s.keep(slab.translate([0, 0, r - (k + 1) * step]))
    solid = s.keep(s.keep(solid.add(top)).add(bottom))
  }
  return solid
}

/** A flat band of constant width along a centre line, as a counter-clockwise polygon (ends square). */
export function band(points: [number, number][], halfWidth: number | ((i: number) => number)): [number, number][] {
  const width = typeof halfWidth === 'number' ? () => halfWidth : halfWidth
  const normal = (i: number) => {
    const [ax, ay] = points[Math.max(0, i - 1)]
    const [bx, by] = points[Math.min(points.length - 1, i + 1)]
    const len = Math.hypot(bx - ax, by - ay) || 1
    return [-(by - ay) / len, (bx - ax) / len] as const
  }
  const left = points.map(([x, y], i) => [x + normal(i)[0] * width(i), y + normal(i)[1] * width(i)] as [number, number])
  const right = points.map(([x, y], i) => [x - normal(i)[0] * width(i), y - normal(i)[1] * width(i)] as [number, number])
  return [...right, ...left.reverse()]
}
