import { lensCutOutline } from '@/geometry/front'
import type { Outline } from '@/geometry/lens'
import type { MeshData } from '@/geometry/manifold-mesh'
import { standInLayout } from '@/geometry/standin'
import type { EyewearConfig } from '@/model/config'

// The lens shapes for the optician (PLAN.md §3 outputs): the outline to cut
// each lens to, so its edge fits the frame's lens groove. Both lenses as the
// wearer's right and left, in millimetres, seen from the front.

export interface LensCut {
  side: 'right' | 'left'
  /** Closed outline, counter-clockwise, at its place on the frame (front view) */
  points: [number, number][]
}

/** Both lens cut outlines, placed as on the frame (X across the face, Y up). */
export function lensCuts(config: EyewearConfig): LensCut[] {
  const l = standInLayout(config)
  const cut: Outline = lensCutOutline(l)
  const right = cut.map(([x, y]) => [l.lensCentreX + x, y] as [number, number])
  // Mirrored for the left lens, reversed so it still runs counter-clockwise
  const left = cut.map(([x, y]) => [-(l.lensCentreX + x), y] as [number, number]).reverse()
  return [
    { side: 'right', points: right },
    { side: 'left', points: left },
  ]
}

const f = (n: number) => n.toFixed(4)

/**
 * ASCII DXF (R12-compatible entities, millimetre units) with one closed
 * polyline per lens on its own layer. Opens in Rhino, AutoCAD, Illustrator and
 * the lens edgers' import tools.
 */
export function lensDxf(config: EyewearConfig): string {
  const out: string[] = []
  const pair = (code: number, value: string | number) => out.push(String(code), String(value))
  pair(0, 'SECTION')
  pair(2, 'HEADER')
  pair(9, '$INSUNITS')
  pair(70, 4) // millimetres
  pair(0, 'ENDSEC')
  pair(0, 'SECTION')
  pair(2, 'ENTITIES')
  for (const lens of lensCuts(config)) {
    pair(0, 'POLYLINE')
    pair(8, lens.side === 'right' ? 'LENS_RIGHT' : 'LENS_LEFT')
    pair(66, 1)
    pair(70, 1) // closed
    for (const [x, y] of lens.points) {
      pair(0, 'VERTEX')
      pair(8, lens.side === 'right' ? 'LENS_RIGHT' : 'LENS_LEFT')
      pair(10, f(x))
      pair(20, f(y))
    }
    pair(0, 'SEQEND')
  }
  pair(0, 'ENDSEC')
  pair(0, 'EOF')
  return out.join('\n') + '\n'
}

/** SVG at true size (1 unit = 1 mm), for printing at 100 % to check the shape. */
export function lensSvg(config: EyewearConfig, label: string): string {
  const lenses = lensCuts(config)
  const all = lenses.flatMap((l) => l.points)
  const pad = 6
  const minX = Math.min(...all.map((p) => p[0])) - pad
  const maxX = Math.max(...all.map((p) => p[0])) + pad
  const minY = Math.min(...all.map((p) => p[1])) - pad
  const maxY = Math.max(...all.map((p) => p[1])) + pad + 8
  const w = maxX - minX
  const h = maxY - minY
  // SVG's Y points down: flip so the lenses are seen from the front, top up
  const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x - minX)} ${f(maxY - y - 8)}`).join(' ') + ' Z'
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}mm" height="${f(h)}mm" viewBox="0 0 ${f(w)} ${f(h)}">`,
    `<title>${escape(label)}</title>`,
    ...lenses.map((l) => `<path d="${path(l.points)}" fill="none" stroke="#000" stroke-width="0.2"/>`),
    `<text x="${f(pad)}" y="${f(h - 3)}" font-family="sans-serif" font-size="3">${escape(label)}</text>`,
    '</svg>',
  ].join('\n')
}

/** Flat lens slabs for the Rhino reference layer, set in the middle of the frame thickness. */
export function lensMeshes(config: EyewearConfig, thickness = 1.6): MeshData[] {
  const zMid = -config.fit.frontThickness / 2
  return lensCuts(config).map(({ points }) => {
    const n = points.length
    const positions = new Float32Array(n * 2 * 3)
    points.forEach(([x, y], i) => {
      positions.set([x, y, zMid + thickness / 2], i * 3)
      positions.set([x, y, zMid - thickness / 2], (n + i) * 3)
    })
    const idx: number[] = []
    // Front and back faces as fans (the outlines are star-shaped around their first point's centre)
    const cx = points.reduce((s, p) => s + p[0], 0) / n
    const cy = points.reduce((s, p) => s + p[1], 0) / n
    const all = new Float32Array(positions.length + 6)
    all.set(positions)
    all.set([cx, cy, zMid + thickness / 2, cx, cy, zMid - thickness / 2], positions.length)
    const front = 2 * n
    const back = 2 * n + 1
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(front, i, j) // front faces +Z
      idx.push(back, n + j, n + i) // back faces -Z
      idx.push(i, n + i, n + j, i, n + j, j) // edge
    }
    return { positions: all, indices: new Uint32Array(idx) }
  })
}
