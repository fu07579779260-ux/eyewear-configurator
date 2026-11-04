import Module, { type ManifoldToplevel } from 'manifold-3d'
import rhino3dm, { type RhinoModule } from 'rhino3dm'
import { beforeAll, describe, expect, it } from 'vitest'
import { lensCutOutline } from '@/geometry/front'
import { bounds, signedArea } from '@/geometry/lens'
import { standInLayout } from '@/geometry/layout'
import { STRINGS } from '@/i18n/strings'
import { DEFAULT_CONFIG } from '@/model/config'
import { sanitizeConfig } from '@/model/sanitize'
import { lensCuts, lensDxf, lensMeshes, lensSvg } from './lens-outline'
import { exportParts, layoutOnBed, meshBounds, type ExportPart } from './parts'
import { RHINO_FILE_VERSION, write3dm, type RhinoPart } from './rhino'
import { toBinaryStl } from './stl'
import { designSummary } from './summary'
import { threeMfModel } from './threemf'

let wasm: ManifoldToplevel
let rhino: RhinoModule
let parts: ExportPart[]
beforeAll(async () => {
  wasm = await Module()
  wasm.setup()
  rhino = await rhino3dm()
  parts = exportParts(wasm, DEFAULT_CONFIG, { inscription: null, number: null })
})

/** Volume of a closed mesh (divergence theorem); positive when its triangles face out. */
function volume(mesh: { positions: Float32Array; indices: Uint32Array }) {
  const p = mesh.positions
  let v = 0
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const [a, b, c] = [mesh.indices[t] * 3, mesh.indices[t + 1] * 3, mesh.indices[t + 2] * 3]
    v += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])
  }
  return v / 6
}

describe('printed parts for export', () => {
  it('lie on the bed with their triangles facing out', () => {
    expect(parts.map((p) => p.id)).toEqual(['front', 'templeRight', 'templeLeft'])
    for (const part of parts) {
      const { min } = meshBounds(part.print)
      for (const k of [0, 1, 2]) expect(min[k]).toBeCloseTo(0, 4)
      expect(volume(part.print)).toBeGreaterThan(0)
      expect(volume(part.assembled)).toBeGreaterThan(0)
    }
  })

  it('make the left temple the mirror image of the right one', () => {
    const right = parts.find((p) => p.id === 'templeRight')!
    const left = parts.find((p) => p.id === 'templeLeft')!
    expect(volume(left.print)).toBeCloseTo(volume(right.print), 1)
    const r = meshBounds(right.assembled)
    const l = meshBounds(left.assembled)
    expect(l.min[0]).toBeCloseTo(-r.max[0], 4)
    expect(l.max[2]).toBeCloseTo(r.max[2], 4)
  })

  it('put the assembled temples behind the frame, outer faces flush with its ends', () => {
    const front = meshBounds(parts[0].assembled)
    const right = meshBounds(parts[1].assembled)
    expect(right.max[0]).toBeCloseTo(front.max[0], 1)
    expect(right.max[2]).toBeLessThan(front.min[2])
  })

  it('nest on one bed without overlapping', () => {
    const laid = layoutOnBed(parts)
    let previousTop = -Infinity
    for (const mesh of laid) {
      const { min, max } = meshBounds(mesh)
      expect(min[1]).toBeGreaterThan(previousTop)
      previousTop = max[1]
    }
  })
})

describe('STL', () => {
  it('writes a binary STL with one record per triangle', () => {
    const stl = toBinaryStl(parts[0].print, 'Eyewear 给妈妈')
    const view = new DataView(stl)
    const count = view.getUint32(80, true)
    expect(count).toBe(parts[0].print.indices.length / 3)
    expect(stl.byteLength).toBe(84 + count * 50)
    // The header keeps ASCII only
    expect(new TextDecoder().decode(new Uint8Array(stl, 0, 7))).toBe('Eyewear')
  })
})

describe('3MF', () => {
  it('writes the three parts as named, coloured objects in mm', () => {
    const laid = layoutOnBed(parts)
    const xml = threeMfModel(
      parts.map((p, i) => ({ name: STRINGS.en[`part.${p.id}` as 'part.front'], colour: p.colour, mesh: laid[i] })),
      'Test',
    )
    expect(xml).toContain('unit="millimeter"')
    expect(xml.match(/<object /g)).toHaveLength(3)
    expect(xml).toContain('name="Front frame"')
    expect(xml).toContain('displaycolor="#C8B597FF"')
  })
})

describe('Rhino', () => {
  it('writes a Rhino 7 file with a layer per part and the lenses', () => {
    const layers: RhinoPart[] = parts.map((p) => ({ name: p.id, colour: p.colour, mesh: p.assembled }))
    for (const mesh of lensMeshes(DEFAULT_CONFIG)) layers.push({ name: 'Lenses', colour: '#cfe0e6', mesh })
    const bytes = write3dm(rhino, layers, 'Test')
    const doc = rhino.File3dm.fromByteArray(bytes)
    expect(doc.objects().count).toBe(5)
    expect(doc.layers().count).toBe(4)
    expect(doc.settings().modelUnitSystem).toBe(rhino.UnitSystem.Millimeters)
    expect(RHINO_FILE_VERSION).toBe(7)
    ;(doc as unknown as { delete(): void }).delete()
  })
})

describe('lens outlines', () => {
  it('cut each lens a little larger than its opening, both running counter-clockwise', () => {
    const l = standInLayout(DEFAULT_CONFIG)
    const cuts = lensCuts(DEFAULT_CONFIG)
    expect(cuts.map((c) => c.side)).toEqual(['right', 'left'])
    for (const c of cuts) {
      expect(signedArea(c.points)).toBeGreaterThan(0)
      expect(bounds(c.points).width).toBeCloseTo(bounds(lensCutOutline(l)).width, 6)
    }
    expect(bounds(cuts[1].points).maxX).toBeCloseTo(-bounds(cuts[0].points).minX, 6)
  })

  it('writes a DXF in millimetres with two closed polylines', () => {
    const dxf = lensDxf(DEFAULT_CONFIG)
    expect(dxf).toMatch(/\$INSUNITS\n70\n4\n/)
    expect(dxf.match(/\nPOLYLINE\n/g)).toHaveLength(2)
    expect(dxf).toContain('LENS_RIGHT')
    expect(dxf).toContain('LENS_LEFT')
    expect(dxf.trim().endsWith('EOF')).toBe(true)
  })

  it('writes an SVG at true size', () => {
    const svg = lensSvg(DEFAULT_CONFIG, 'Test & <lenses>')
    expect(svg).toMatch(/width="[\d.]+mm"/)
    expect(svg.match(/<path /g)).toHaveLength(2)
    expect(svg).toContain('Test &amp; &lt;lenses>')
  })
})

describe('summary', () => {
  it('describes the design in both languages, with the size code and checks', () => {
    const config = sanitizeConfig({ personal: { inscription: 'JL', textSize: 2 } })
    for (const lang of ['en', 'zh'] as const) {
      const s = designSummary(config, lang)
      expect(s.sizeCode).toBe('50.5□18-145')
      expect(s.rows.length).toBeGreaterThan(10)
      expect(s.rows.every(([label, value]) => label && value)).toBe(true)
      expect(s.checks).toHaveLength(1) // the small letters
      expect(s.assembly[0]).toContain('4.5 × 2.8 × 1 mm')
    }
  })
})
