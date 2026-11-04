import type { Manifold } from 'manifold-3d'
import { BufferAttribute, BufferGeometry } from 'three'

export interface MeshData {
  positions: Float32Array
  indices: Uint32Array
}

/** Manifold solid → plain mesh (positions only). */
export function fromManifold(m: Manifold): MeshData {
  const mesh = m.getMesh()
  const n = mesh.vertProperties.length / mesh.numProp
  const positions = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) positions[i * 3 + k] = mesh.vertProperties[i * mesh.numProp + k]
  }
  return { positions, indices: new Uint32Array(mesh.triVerts) }
}

/**
 * Plain mesh → three.js geometry for the preview. Faces are split apart so
 * each keeps its own normal: crisp edges, and the stepped rounding of the
 * frame edge reads as a soft bevel instead of being smeared.
 */
export function toGeometry(data: MeshData): BufferGeometry {
  const indexed = new BufferGeometry()
  indexed.setAttribute('position', new BufferAttribute(data.positions, 3))
  indexed.setIndex(new BufferAttribute(data.indices, 1))
  const flat = indexed.toNonIndexed()
  indexed.dispose()
  flat.computeVertexNormals()
  // Planar UVs in millimetres (front view), for the nylon grain
  const pos = flat.getAttribute('position')
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) + pos.getZ(i)
    uv[i * 2 + 1] = pos.getY(i) + pos.getZ(i)
  }
  flat.setAttribute('uv', new BufferAttribute(uv, 2))
  flat.computeBoundingBox()
  flat.computeBoundingSphere()
  return flat
}
