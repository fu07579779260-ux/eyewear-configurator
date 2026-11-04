import { useMemo } from 'react'
import { CanvasTexture, NoColorSpace, RepeatWrapping } from 'three'

// Materials for the preview. Dyed SLS nylon is matte with a fine, even grain;
// the hinges and screws are brushed steel; the lenses are clear.

/** Size of one tile of the nylon grain on the part, in mm. */
const GRAIN_TILE_MM = 6

/** Seeded random numbers, so the grain looks the same on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fine powder grain as a bump map, drawn locally (no texture download). */
function useNylonGrain() {
  return useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const image = ctx.createImageData(size, size)
    const random = mulberry32(12)
    for (let i = 0; i < size * size; i++) {
      const v = 110 + random() * 90
      image.data.set([v, v, v, 255], i * 4)
    }
    ctx.putImageData(image, 0, 0)
    const texture = new CanvasTexture(canvas)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    // Extruded parts get UVs in millimetres, so one repeat per tile
    texture.repeat.set(1 / GRAIN_TILE_MM, 1 / GRAIN_TILE_MM)
    texture.colorSpace = NoColorSpace
    return texture
  }, [])
}

export function NylonMaterial({ colour }: { colour: string }) {
  const grain = useNylonGrain()
  return (
    <meshStandardMaterial
      color={colour}
      roughness={0.86}
      metalness={0}
      bumpMap={grain}
      bumpScale={0.35}
      envMapIntensity={0.7}
    />
  )
}

export function SteelMaterial() {
  return <meshStandardMaterial color="#bdb7ae" roughness={0.32} metalness={1} envMapIntensity={1.1} />
}

export function LensMaterial() {
  return (
    <meshPhysicalMaterial
      color="#ffffff"
      roughness={0.04}
      metalness={0}
      transparent
      opacity={0.18}
      clearcoat={1}
      clearcoatRoughness={0.03}
      envMapIntensity={1.4}
      depthWrite={false}
    />
  )
}
