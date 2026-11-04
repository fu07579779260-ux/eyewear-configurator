import { traceOutline, type InkGrid, type Outline } from '@/geometry/trace'

// Draw text on a canvas and trace it into outlines (the same approach as the
// perfume configurator). Text uses the fonts already on the device, including
// Chinese ones, so no font file has to be downloaded (the site must also work
// in mainland China); the exact letter shapes follow the device's fonts.

/** Drawing resolution: pixels per millimetre */
const PX_PER_MM = 16
/** Bold, so strokes are thick enough to engrave in SLS nylon */
const TEXT_FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif'
const NUMBER_FONT = 'ui-monospace, Consolas, "Cascadia Mono", monospace'

function inkFrom(ctx: CanvasRenderingContext2D, w: number, h: number): InkGrid {
  const data = ctx.getImageData(0, 0, w, h).data
  const ink = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) ink[i] = data[i * 4 + 3] > 127 ? 1 : 0
  return { width: w, height: h, ink }
}

/** One line of text as outlines in mm, centred on (0, 0); `size` is the cap height in mm. */
export function textOutline(text: string, size: number, font: 'text' | 'number' = 'text'): Outline {
  const line = text.trim()
  if (!line) return []
  // Cap height is about 0.72 of the font size for these fonts
  const px = Math.round((size / 0.72) * PX_PER_MM)
  const fontCss = `700 ${px}px ${font === 'number' ? NUMBER_FONT : TEXT_FONT}`
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = fontCss
  const pad = Math.ceil(px * 0.3)
  const w = Math.ceil(measure.measureText(line).width) + 2 * pad
  const h = Math.ceil(px * 1.3) + 2 * pad
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.font = fontCss
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(line, w / 2, h / 2)
  return traceOutline(inkFrom(ctx, w, h), PX_PER_MM)
}
