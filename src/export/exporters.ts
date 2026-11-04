import JSZip from 'jszip'
import type { Marks } from '@/geometry/engrave'
import { loadManifold } from '@/geometry/manifold-loader'
import { STRINGS, type Language } from '@/i18n/strings'
import type { EyewearConfig } from '@/model/config'
import { buildShareUrl, designCode, toDesignFile } from '@/model/serialize'
import { lensDxf, lensMeshes, lensSvg } from './lens-outline'
import { loadRhino } from './load-rhino'
import { exportParts, layoutOnBed, type ExportPart, type PartId } from './parts'
import { write3dm } from './rhino'
import { designCard, specSheetPdf } from './sheets'
import { toBinaryStl } from './stl'
import { designSummary } from './summary'
import { write3mf } from './threemf'

// Every download the app offers, each returning the file to save.

export type ExportFormat = 'zip' | '3mf' | '3dm' | 'stl-front' | 'stl-temples' | 'lens' | 'pdf' | 'png' | 'json'

export interface ExportFile {
  data: BlobPart
  name: string
  type: string
}

/** e.g. eyewear-EY-7K3QX-catEye */
export const baseName = (c: EyewearConfig) => `eyewear-${designCode(c)}-${c.shape.frame}`

const PART_KEY = { front: 'part.front', templeRight: 'part.templeRight', templeLeft: 'part.templeLeft' } as const
const partName = (id: PartId, lang: Language) => STRINGS[lang][PART_KEY[id]]
/** File-name friendly part names (always English, so the files sort the same everywhere) */
const PART_FILE: Record<PartId, string> = { front: 'frame', templeRight: 'temple-right', templeLeft: 'temple-left' }

const stlOf = (part: ExportPart, title: string, lang: Language) => toBinaryStl(part.print, `${title} - ${partName(part.id, lang)}`)

async function threeMf(parts: ExportPart[], title: string, lang: Language) {
  const laid = layoutOnBed(parts)
  return write3mf(
    parts.map((p, i) => ({ name: partName(p.id, lang), colour: p.colour, mesh: laid[i] })),
    title,
  )
}

async function rhinoFile(config: EyewearConfig, parts: ExportPart[], title: string, lang: Language) {
  const rhino = await loadRhino()
  const layers = parts.map((p) => ({ name: partName(p.id, lang), colour: p.colour, mesh: p.assembled }))
  for (const mesh of lensMeshes(config)) layers.push({ name: STRINGS[lang]['part.lenses'], colour: '#cfe0e6', mesh })
  return write3dm(rhino, layers, title)
}

export async function exportDesign(format: ExportFormat, config: EyewearConfig, marks: Marks, lang: Language): Promise<ExportFile> {
  const base = baseName(config)
  const title = `${STRINGS[lang]['app.title']} ${designCode(config)}`
  const shareUrl = buildShareUrl(config, window.location.href)

  switch (format) {
    case 'png':
      return { data: await designCard(designSummary(config, lang), shareUrl, lang), name: `${base}-card.png`, type: 'image/png' }
    case 'pdf':
      return { data: await specSheetPdf(designSummary(config, lang), shareUrl, lang), name: `${base}-spec.pdf`, type: 'application/pdf' }
    case 'lens':
      return { data: lensDxf(config), name: `${base}-lenses.dxf`, type: 'application/dxf' }
    case 'json':
      return { data: toDesignFile(config), name: `${base}.json`, type: 'application/json' }
  }

  const wasm = await loadManifold()
  const parts = exportParts(wasm, config, marks)
  const byId = (id: PartId) => parts.find((p) => p.id === id)!

  switch (format) {
    case 'stl-front':
      return { data: stlOf(byId('front'), title, lang), name: `${base}-${PART_FILE.front}.stl`, type: 'model/stl' }
    case 'stl-temples': {
      const zip = new JSZip()
      for (const id of ['templeRight', 'templeLeft'] as const) zip.file(`${base}-${PART_FILE[id]}.stl`, stlOf(byId(id), title, lang))
      return { data: await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }), name: `${base}-temples.zip`, type: 'application/zip' }
    }
    case '3mf':
      return { data: await threeMf(parts, title, lang), name: `${base}.3mf`, type: 'model/3mf' }
    case '3dm':
      return { data: await rhinoFile(config, parts, title, lang), name: `${base}.3dm`, type: 'application/octet-stream' }
    case 'zip': {
      // The complete set of production files for one pair (PLAN.md §3)
      const zip = new JSZip()
      for (const part of parts) zip.file(`print/${base}-${PART_FILE[part.id]}.stl`, stlOf(part, title, lang))
      zip.file(`print/${base}.3mf`, await threeMf(parts, title, lang))
      zip.file(`lenses/${base}-lenses.dxf`, lensDxf(config))
      zip.file(`lenses/${base}-lenses.svg`, lensSvg(config, `${title} · ${STRINGS[lang]['part.lenses']}`))
      zip.file(`${base}-spec.pdf`, await specSheetPdf(designSummary(config, lang), shareUrl, lang))
      zip.file(`${base}.json`, toDesignFile(config))
      try {
        zip.file(`rhino/${base}.3dm`, await rhinoFile(config, parts, title, lang))
      } catch (error) {
        // Rhino's file kernel is large; if it can't load, the print files are still complete
        console.error('Rhino file left out of the bundle', error)
      }
      return { data: await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }), name: `${base}-production.zip`, type: 'application/zip' }
    }
  }
}
