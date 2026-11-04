/**
 * The 3D view registers a function that renders one frame at a given size
 * and returns it as a canvas, so exports (PNG, PDF) can include a picture of
 * the glasses framed for their own layout, not the shape of the preview.
 */
type Capture = (width: number, height: number) => HTMLCanvasElement

let capture: Capture | null = null

export function registerCapture(fn: Capture | null) {
  capture = fn
}

/** A JPEG of the glasses at the given size (for the sheets), or null when the view isn't open. */
export function captureJpegDataUrl(width = 1200, height = 900): string | null {
  const canvas = capture?.(width, height)
  if (!canvas) return null
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')!
  // JPEG has no transparency: start from the studio backdrop colour
  ctx.fillStyle = '#ece3d6'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(canvas, 0, 0)
  return out.toDataURL('image/jpeg', 0.88)
}
