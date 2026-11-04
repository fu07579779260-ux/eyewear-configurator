import type { ManifoldToplevel } from 'manifold-3d'
import type { Marks } from '@/geometry/engrave'
import { buildFrontFrame } from '@/geometry/front'
import { hingeLayout } from '@/geometry/hinge'
import { fromManifold, type MeshData } from '@/geometry/manifold-mesh'
import { buildTemple } from '@/geometry/temple'
import { DYE_HEX, templeColour, type EyewearConfig } from '@/model/config'

// The printed parts for export, each as a plain mesh in millimetres.
//
// Two placements are used:
// - "print": each part lying flat, Z up (the slicer's axis). SLS needs no
//   supports, so flat is simply the most compact way to nest the parts;
// - "assembled": the parts where they sit on the finished glasses, in the
//   scene's axes (Y up), for Rhino and the spec sheet.
//
// The left temple is the mirror image of the right one (with its own
// engraving), so its print mesh is mirrored through its thickness.

export type PartId = 'front' | 'templeRight' | 'templeLeft'

export interface ExportPart {
  id: PartId
  colour: string
  /** Lying flat, Z up, ready for the slicer */
  print: MeshData
  /** On the finished glasses, scene axes (Y up) */
  assembled: MeshData
}

/** Apply a point transform; mirror transforms also flip the triangles so they keep facing out. */
export function transformMesh(mesh: MeshData, f: (x: number, y: number, z: number) => [number, number, number], mirror = false): MeshData {
  const positions = new Float32Array(mesh.positions.length)
  for (let i = 0; i < positions.length; i += 3) {
    const [x, y, z] = f(mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2])
    positions[i] = x
    positions[i + 1] = y
    positions[i + 2] = z
  }
  const indices = new Uint32Array(mesh.indices)
  if (mirror) {
    for (let t = 0; t < indices.length; t += 3) [indices[t + 1], indices[t + 2]] = [indices[t + 2], indices[t + 1]]
  }
  return { positions, indices }
}

export function meshBounds(mesh: MeshData) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < mesh.positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], mesh.positions[i + k])
      max[k] = Math.max(max[k], mesh.positions[i + k])
    }
  }
  return { min, max }
}

/** Move a mesh so its lowest corner sits at the origin (on the bed). */
const toOrigin = (mesh: MeshData) => {
  const { min } = meshBounds(mesh)
  return transformMesh(mesh, (x, y, z) => [x - min[0], y - min[1], z - min[2]])
}

/** Build all printed parts at full export quality. */
export function exportParts(wasm: ManifoldToplevel, config: EyewearConfig, marks: Marks): ExportPart[] {
  const h = hingeLayout(config)
  const frame = DYE_HEX[config.colour.frame]
  const temple = DYE_HEX[templeColour(config)]

  const { solid: frontSolid } = buildFrontFrame(wasm, config)
  const front = fromManifold(frontSolid)
  frontSolid.delete()

  const templeMesh = (side: 'right' | 'left') => {
    const solid = buildTemple(wasm, config, side, marks)
    const mesh = fromManifold(solid)
    solid.delete()
    return mesh
  }
  const right = templeMesh('right')
  const left = templeMesh('left')

  // Temple print frame → open on the glasses (right side): length along -Z, thickness along +X
  const open = (x: number, y: number, z: number): [number, number, number] => [h.templeInnerX + z, h.y + y, h.templeFrontZ - x]

  return [
    // The front lies flat on its back face: scene Z (front to back) becomes the print Z
    { id: 'front', colour: frame, print: toOrigin(front), assembled: front },
    { id: 'templeRight', colour: temple, print: toOrigin(right), assembled: transformMesh(right, open) },
    {
      id: 'templeLeft',
      colour: temple,
      // The physical left temple is the mirror image through its thickness
      print: toOrigin(transformMesh(left, (x, y, z) => [x, y, -z], true)),
      assembled: transformMesh(
        left,
        (x, y, z) => {
          const [ox, oy, oz] = open(x, y, z)
          return [-ox, oy, oz]
        },
        true,
      ),
    },
  ]
}

/**
 * Nest the print meshes on one bed for the 3MF: the front, then the two
 * temples below it, with a gap between parts.
 */
export function layoutOnBed(parts: ExportPart[], gap = 6): MeshData[] {
  let y = 0
  return parts.map((part) => {
    const { max } = meshBounds(part.print)
    const placed = transformMesh(part.print, (px, py, pz) => [px, py + y, pz])
    y += max[1] + gap
    return placed
  })
}
