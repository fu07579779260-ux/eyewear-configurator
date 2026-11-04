import type { EyewearConfig, FrameShape } from '@/model/config'

// Lens outlines (PLAN.md §9 step 5).
//
// An outline is the shape of one lens seen from the front, as a closed
// polygon of 2D points in millimetres. It is drawn for the wearer's RIGHT
// lens, centred on (0, 0): +X points outwards (towards the hinge and the
// temple), -X towards the nose, +Y up. The left lens is the same outline
// mirrored in X.
//
// Sizes follow the optical "boxing system": the lens width and height are
// the width and height of the smallest box around the lens. Every outline is
// scaled to fit that box exactly, so the lens width shown in the size code
// (e.g. 50.5□18-145) is the real width of the drawn lens.

export type Point = readonly [number, number]
export type Outline = Point[]

/** Points per outline: smooth enough for printing, light enough for the preview. */
export const OUTLINE_POINTS = 160

export interface LensSpec {
  shape: FrameShape
  width: number
  height: number
  /** Rounded Square: corner radius in mm */
  cornerRadius: number
  /** Cat-Eye: how much the outer top corner rises, in mm */
  wingLift: number
}

export function lensSpec(config: EyewearConfig, width: number): LensSpec {
  return {
    shape: config.shape.frame,
    width,
    height: config.fit.lensHeight,
    cornerRadius: config.shape.cornerRadius,
    wingLift: config.shape.wingLift,
  }
}

// ---------- Shapes, before fitting to the box ----------

/** Round: an ellipse, so a lens wider than it is tall stays smooth all round. */
function roundRaw(n: number): Outline {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return [Math.cos(a), Math.sin(a)] as const
  })
}

/**
 * Rounded Square: a rectangle with circular corners, sampled evenly along
 * its length so that straight sides and corners get a fair share of points.
 */
function roundedSquareRaw(n: number, w: number, h: number, radius: number): Outline {
  const r = Math.max(0.5, Math.min(radius, w / 2 - 0.01, h / 2 - 0.01))
  const sx = w / 2 - r
  const sy = h / 2 - r
  // Path pieces counter-clockwise, starting at the middle of the outer (right) side
  const pieces: { length: number; at: (t: number) => Point }[] = [
    { length: sy, at: (t) => [w / 2, t * sy] },
    { length: (Math.PI / 2) * r, at: (t) => arc(sx, sy, r, 0, t) },
    { length: 2 * sx, at: (t) => [sx - t * 2 * sx, h / 2] },
    { length: (Math.PI / 2) * r, at: (t) => arc(-sx, sy, r, Math.PI / 2, t) },
    { length: 2 * sy, at: (t) => [-w / 2, sy - t * 2 * sy] },
    { length: (Math.PI / 2) * r, at: (t) => arc(-sx, -sy, r, Math.PI, t) },
    { length: 2 * sx, at: (t) => [-sx + t * 2 * sx, -h / 2] },
    { length: (Math.PI / 2) * r, at: (t) => arc(sx, -sy, r, Math.PI * 1.5, t) },
    { length: sy, at: (t) => [w / 2, -sy + t * sy] },
  ]
  const total = pieces.reduce((sum, p) => sum + p.length, 0)
  const points: Point[] = []
  for (let i = 0; i < n; i++) {
    let d = (i / n) * total
    for (const piece of pieces) {
      if (d <= piece.length || piece === pieces[pieces.length - 1]) {
        points.push(piece.at(piece.length > 0 ? Math.min(1, d / piece.length) : 0))
        break
      }
      d -= piece.length
    }
  }
  return points
}

const arc = (cx: number, cy: number, r: number, start: number, t: number): Point => {
  const a = start + t * (Math.PI / 2)
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/**
 * Cat-Eye: a soft lens whose outer top corner sweeps up into a wing, with a
 * flatter brow, a rounder nose side and a bottom that tapers towards the
 * temple. Drawn through control points with a closed centripetal
 * Catmull-Rom curve, so it stays smooth for any wing lift.
 */
function catEyeRaw(n: number, w: number, h: number, wingLift: number): Outline {
  const lift = Math.max(0, wingLift)
  const control: Point[] = [
    [0.47 * w, 0.02 * h], // outer side, sloping in towards the bottom
    [0.52 * w, 0.3 * h + 0.4 * lift], // under the wing
    [0.47 * w, 0.5 * h + lift], // wing tip
    [0.2 * w, 0.46 * h + 0.45 * lift], // brow, rising towards the wing
    [-0.16 * w, 0.42 * h + 0.1 * lift], // brow, nose side
    [-0.44 * w, 0.3 * h], // inner top
    [-0.5 * w, 0], // nose side
    [-0.38 * w, -0.38 * h], // inner bottom
    [-0.06 * w, -0.5 * h], // bottom, deepest towards the nose
    [0.3 * w, -0.34 * h], // outer bottom, tapering up
  ]
  return closedCatmullRom(control, n)
}

/** Closed centripetal Catmull-Rom curve through the points, resampled to n points. */
export function closedCatmullRom(control: Point[], n: number): Outline {
  const m = control.length
  const dense: Point[] = []
  const perSegment = 40
  for (let i = 0; i < m; i++) {
    const p0 = control[(i - 1 + m) % m]
    const p1 = control[i]
    const p2 = control[(i + 1) % m]
    const p3 = control[(i + 2) % m]
    const t0 = 0
    const t1 = t0 + Math.sqrt(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]))
    const t2 = t1 + Math.sqrt(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]))
    const t3 = t2 + Math.sqrt(Math.hypot(p3[0] - p2[0], p3[1] - p2[1]))
    for (let k = 0; k < perSegment; k++) {
      const t = t1 + ((t2 - t1) * k) / perSegment
      dense.push(catmullRomPoint(p0, p1, p2, p3, t0, t1, t2, t3, t))
    }
  }
  return resample(dense, n)
}

function catmullRomPoint(
  p0: Point, p1: Point, p2: Point, p3: Point,
  t0: number, t1: number, t2: number, t3: number, t: number,
): Point {
  const lerp = (a: Point, b: Point, ta: number, tb: number): Point => {
    const u = tb === ta ? 0 : (t - ta) / (tb - ta)
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
  }
  const a1 = lerp(p0, p1, t0, t1)
  const a2 = lerp(p1, p2, t1, t2)
  const a3 = lerp(p2, p3, t2, t3)
  const b1 = lerp(a1, a2, t0, t2)
  const b2 = lerp(a2, a3, t1, t3)
  return lerp(b1, b2, t1, t2)
}

/** Resample a closed polygon to n points spaced evenly along its length. */
export function resample(points: Outline, n: number): Outline {
  const lengths = [0]
  for (let i = 1; i <= points.length; i++) {
    const a = points[i - 1]
    const b = points[i % points.length]
    lengths.push(lengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]))
  }
  const total = lengths[points.length]
  const out: Point[] = []
  let j = 0
  for (let i = 0; i < n; i++) {
    const d = (i / n) * total
    while (lengths[j + 1] < d) j++
    const a = points[j]
    const b = points[(j + 1) % points.length]
    const span = lengths[j + 1] - lengths[j] || 1
    const u = (d - lengths[j]) / span
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u])
  }
  return out
}

// ---------- Fitting and measuring ----------

export function bounds(outline: Outline) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of outline) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/** Scale and move the outline so its box is exactly width × height, centred on (0, 0). */
function fitToBox(outline: Outline, width: number, height: number): Outline {
  const b = bounds(outline)
  const cx = (b.minX + b.maxX) / 2
  const cy = (b.minY + b.maxY) / 2
  return outline.map(([x, y]) => [((x - cx) * width) / b.width, ((y - cy) * height) / b.height] as const)
}

/** Signed area: positive when the points run counter-clockwise. */
export function signedArea(outline: Outline): number {
  let sum = 0
  for (let i = 0; i < outline.length; i++) {
    const [x1, y1] = outline[i]
    const [x2, y2] = outline[(i + 1) % outline.length]
    sum += x1 * y2 - x2 * y1
  }
  return sum / 2
}

export function perimeter(outline: Outline): number {
  let sum = 0
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]
    const b = outline[(i + 1) % outline.length]
    sum += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return sum
}

/**
 * Grow (positive distance) or shrink the outline by moving every point along
 * its outward normal. Good for the smooth, mostly convex lens shapes here,
 * for distances well below their smallest corner radius.
 */
export function offsetOutline(outline: Outline, distance: number): Outline {
  const n = outline.length
  return outline.map(([x, y], i) => {
    const [px, py] = outline[(i - 1 + n) % n]
    const [nx, ny] = outline[(i + 1) % n]
    // Counter-clockwise points: the outward normal is the tangent turned clockwise
    const tx = nx - px
    const ty = ny - py
    const len = Math.hypot(tx, ty) || 1
    return [x + (ty / len) * distance, y - (tx / len) * distance] as const
  })
}

/** The lens outline for a shape and size, counter-clockwise, fitted to its box. */
export function lensOutline(spec: LensSpec, n = OUTLINE_POINTS): Outline {
  const { width: w, height: h } = spec
  let raw: Outline
  switch (spec.shape) {
    case 'round':
      raw = roundRaw(n)
      break
    case 'roundedSquare':
      raw = roundedSquareRaw(n, w, h, spec.cornerRadius)
      break
    case 'catEye':
      raw = catEyeRaw(n, w, h, spec.wingLift)
      break
  }
  const fitted = fitToBox(raw, w, h)
  return signedArea(fitted) < 0 ? fitted.reverse() : fitted
}

/** Highest point of the outline (for the cat-eye wing and for placing the bridge). */
export function topPoint(outline: Outline): Point {
  return outline.reduce((best, p) => (p[1] > best[1] ? p : best))
}

/** Y of the outline's edge at a given X, on the upper side (for placing the bridge and end pieces). */
export function upperEdgeAt(outline: Outline, x: number): number {
  let best = -Infinity
  for (let i = 0; i < outline.length; i++) {
    const [x1, y1] = outline[i]
    const [x2, y2] = outline[(i + 1) % outline.length]
    if ((x1 - x) * (x2 - x) <= 0 && x1 !== x2) {
      const y = y1 + ((y2 - y1) * (x - x1)) / (x2 - x1)
      best = Math.max(best, y)
    }
  }
  return best
}
