import QRCode from 'qrcode'
import { STRINGS, type Language } from '@/i18n/strings'
import { captureJpegDataUrl } from './capture'
import type { Summary } from './summary'

// The design card (PNG, to share) and the spec sheet (A4 PDF, to print or
// hand to a print service and the optician). Both are drawn on a canvas with
// the device's fonts, so Chinese text works without a font file.

const FONT = '"Nunito Sans Variable", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif'
const MONO = 'ui-monospace, Consolas, "Cascadia Mono", monospace'
/** The app's warm studio palette */
const C = { oat: '#efe8de', linen: '#f8f4ee', ink: '#3a342e', muted: '#6e655b', sage: '#55654f', warn: '#8a3b33', rule: '#d8cebf', backdrop: '#ece3d6' }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Wrap text into lines that fit `width`. Splits on spaces, or between characters for Chinese. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const tokens = /\s/.test(text) && !/[㐀-鿿]/.test(text) ? text.split(/(\s+)/) : Array.from(text)
  const lines: string[] = []
  let line = ''
  for (const tok of tokens) {
    const next = line + tok
    if (ctx.measureText(next).width > width && line.trim()) {
      lines.push(line.trim())
      line = tok.trimStart()
    } else {
      line = next
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

/** Draw wrapped text; returns the y below it. */
function para(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number): number {
  for (const l of wrap(ctx, text, width)) {
    ctx.fillText(l, x, y)
    y += lineHeight
  }
  return y
}

async function qrImage(url: string, size: number) {
  return loadImage(await QRCode.toDataURL(url, { margin: 1, width: size, errorCorrectionLevel: 'L', color: { dark: C.ink, light: '#ffffff' } }))
}

async function renderImage(width: number, height: number): Promise<HTMLImageElement | null> {
  const data = captureJpegDataUrl(width, height)
  return data ? loadImage(data) : null
}

/** Draw the render inside a box, keeping its proportions. */
function drawFit(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const k = Math.min(w / img.width, h / img.height)
  ctx.drawImage(img, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k)
}

/** A 1600 × 900 card: render, name, size, code, key facts and a QR code to open the design. */
export async function designCard(summary: Summary, shareUrl: string, lang: Language): Promise<Blob> {
  const t = STRINGS[lang]
  const canvas = document.createElement('canvas')
  canvas.width = 1600
  canvas.height = 900
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = C.oat
  ctx.fillRect(0, 0, 1600, 900)
  ctx.fillStyle = C.backdrop
  ctx.fillRect(40, 40, 860, 820)
  const render = await renderImage(860, 820)
  if (render) drawFit(ctx, render, 40, 40, 860, 820)

  const x = 960
  ctx.fillStyle = C.sage
  ctx.font = `700 24px ${FONT}`
  ctx.fillText(t['home.kicker'].toUpperCase(), x, 110)
  ctx.fillStyle = C.ink
  ctx.font = `800 64px ${FONT}`
  let y = para(ctx, summary.title, x, 190, 580, 70)
  ctx.font = `700 40px ${MONO}`
  ctx.fillStyle = C.sage
  ctx.fillText(`${summary.sizeCode}  ·  ${summary.code}`, x, y + 20)
  y += 90
  ctx.font = `400 24px ${FONT}`
  const keep = new Set([t['summary.shape'], t['colours.frame'], t['colours.temples'], t['summary.texture'], t['summary.inscription']])
  for (const [label, value] of summary.rows.filter(([label]) => keep.has(label))) {
    ctx.fillStyle = C.muted
    ctx.fillText(label, x, y)
    ctx.fillStyle = C.ink
    y = para(ctx, value, x + 200, y, 380, 30) + 10
    if (y > 640) break
  }
  const qr = await qrImage(shareUrl, 200)
  ctx.drawImage(qr, 1360, 660, 200, 200)
  ctx.fillStyle = C.muted
  ctx.font = `400 20px ${FONT}`
  para(ctx, t['sheet.qr'], x, 700, 360, 28)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
}

/** An A4 spec sheet at 150 dpi, as a canvas (the PDF embeds it). */
export async function specCanvas(summary: Summary, shareUrl: string, lang: Language): Promise<HTMLCanvasElement> {
  const t = STRINGS[lang]
  const W = 1240
  const H = 1754
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  const left = 90
  const heading = (text: string, y: number) => {
    ctx.fillStyle = C.sage
    ctx.font = `700 21px ${FONT}`
    ctx.fillText(text.toUpperCase(), left, y)
    ctx.fillStyle = C.rule
    ctx.fillRect(left, y + 10, W - 2 * left, 2)
    return y + 42
  }
  const bullets = (items: string[], y: number) => {
    ctx.font = `400 20px ${FONT}`
    ctx.fillStyle = C.ink
    for (const item of items) y = para(ctx, `•  ${item}`, left, y, W - 2 * left, 27) + 4
    return y
  }

  ctx.fillStyle = C.sage
  ctx.font = `700 21px ${FONT}`
  ctx.fillText(t['sheet.title'].toUpperCase(), left, 100)
  ctx.fillStyle = C.ink
  ctx.font = `800 54px ${FONT}`
  ctx.fillText(summary.title, left, 170)
  ctx.font = `700 32px ${MONO}`
  ctx.fillStyle = C.sage
  ctx.fillText(`${summary.sizeCode}  ·  ${summary.code}`, left, 220)

  const box = { x: W - left - 470, y: 250, w: 470, h: 340 }
  const render = await renderImage(box.w * 2, box.h * 2)
  ctx.fillStyle = C.backdrop
  ctx.fillRect(box.x, box.y, box.w, box.h)
  if (render) drawFit(ctx, render, box.x, box.y, box.w, box.h)

  let y = heading(t['sheet.parameters'], 290)
  ctx.font = `400 19px ${FONT}`
  for (const [label, value] of summary.rows) {
    const narrow = y < box.y + box.h + 10
    ctx.fillStyle = C.muted
    ctx.fillText(label, left, y)
    ctx.fillStyle = C.ink
    y = para(ctx, value, left + 210, y, narrow ? 260 : W - 2 * left - 210, 25) + 5
  }

  y = heading(t['sheet.printing'], Math.max(y + 18, box.y + box.h + 40))
  y = bullets(summary.printTips, y)
  y = heading(t['sheet.finishing'], y + 16)
  y = bullets(summary.finishing, y)
  y = heading(t['sheet.assembly'], y + 16)
  y = bullets(summary.assembly, y)

  y = heading(t['check.title'], y + 20)
  ctx.font = `400 20px ${FONT}`
  if (!summary.checks.length) {
    ctx.fillStyle = C.sage
    ctx.fillText(t['check.allGood'], left, y)
  }
  for (const c of summary.checks) {
    ctx.fillStyle = C.warn
    y = para(ctx, `•  ${c}`, left, y, W - 2 * left, 27) + 4
  }

  const qr = await qrImage(shareUrl, 200)
  ctx.drawImage(qr, W - left - 200, H - 300, 200, 200)
  ctx.fillStyle = C.muted
  ctx.font = `400 18px ${FONT}`
  para(ctx, t['sheet.qr'], left, H - 220, W - 2 * left - 240, 25)
  ctx.fillText(`${t['app.title']} · ${t['footer.units']}`, left, H - 80)
  return canvas
}

export async function specSheetPdf(summary: Summary, shareUrl: string, lang: Language): Promise<ArrayBuffer> {
  const canvas = await specCanvas(summary, shareUrl, lang)
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  pdf.setProperties({ title: `${summary.title} – ${summary.code}`, creator: 'Eyewear Configurator' })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297)
  return pdf.output('arraybuffer')
}
