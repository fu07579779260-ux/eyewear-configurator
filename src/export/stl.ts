import type { MeshData } from '@/geometry/manifold-mesh'

const HEADER_BYTES = 80
const TRIANGLE_BYTES = 50

/**
 * Binary STL of an indexed mesh, written as given: export meshes are already
 * in print placement (Z up, millimetres).
 */
export function toBinaryStl(mesh: MeshData, title = 'eyewear-configurator'): ArrayBuffer {
  const { positions: p, indices } = mesh
  const count = indices.length / 3
  const buffer = new ArrayBuffer(HEADER_BYTES + 4 + count * TRIANGLE_BYTES)
  const view = new DataView(buffer)

  // The header is plain ASCII by convention; keep only printable ASCII
  const header = new TextEncoder().encode(title.replace(/[^\x20-\x7e]/g, '').slice(0, HEADER_BYTES))
  new Uint8Array(buffer, 0, HEADER_BYTES).set(header)
  view.setUint32(HEADER_BYTES, count, true)

  const v = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  let offset = HEADER_BYTES + 4
  for (let t = 0; t < count; t++) {
    for (let k = 0; k < 3; k++) {
      const i = indices[t * 3 + k] * 3
      v[k * 3] = p[i]
      v[k * 3 + 1] = p[i + 1]
      v[k * 3 + 2] = p[i + 2]
    }
    // Face normal from the winding (outward for our meshes)
    const ux = v[3] - v[0], uy = v[4] - v[1], uz = v[5] - v[2]
    const wx = v[6] - v[0], wy = v[7] - v[1], wz = v[8] - v[2]
    let nx = uy * wz - uz * wy
    let ny = uz * wx - ux * wz
    let nz = ux * wy - uy * wx
    const len = Math.hypot(nx, ny, nz) || 1
    nx /= len
    ny /= len
    nz /= len

    for (const n of [nx, ny, nz, ...v]) {
      view.setFloat32(offset, n, true)
      offset += 4
    }
    view.setUint16(offset, 0, true)
    offset += 2
  }
  return buffer
}
