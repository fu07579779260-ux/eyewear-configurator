import { DEFAULT_CONFIG, type EyewearConfig, type Section } from './config'
import { sanitizeConfig } from './sanitize'

export const FILE_FORMAT = 'eyewear-configurator'
export const FILE_VERSION = 1

// ---------- JSON design file ----------

export function toDesignFile(config: EyewearConfig, savedAt = new Date()): string {
  return JSON.stringify(
    { format: FILE_FORMAT, version: FILE_VERSION, savedAt: savedAt.toISOString(), config },
    null,
    2,
  )
}

export type ParseResult =
  | { ok: true; config: EyewearConfig }
  | { ok: false; error: 'invalid-json' | 'not-a-design' | 'newer-version' }

export function parseDesignFile(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'invalid-json' }
  }
  if (typeof data !== 'object' || data === null) return { ok: false, error: 'not-a-design' }
  const file = data as { format?: unknown; version?: unknown; config?: unknown }
  if (file.format !== FILE_FORMAT || typeof file.config !== 'object') return { ok: false, error: 'not-a-design' }
  if (typeof file.version === 'number' && file.version > FILE_VERSION) return { ok: false, error: 'newer-version' }
  return { ok: true, config: sanitizeConfig(file.config) }
}

// ---------- Share link ----------

/** Keep only the fields that differ from the defaults, so links stay short. */
function diffFromDefaults(config: EyewearConfig) {
  const diff: Partial<Record<Section, Record<string, unknown>>> = {}
  for (const section of Object.keys(DEFAULT_CONFIG) as Section[]) {
    const defaults = DEFAULT_CONFIG[section] as unknown as Record<string, unknown>
    const values = config[section] as unknown as Record<string, unknown>
    for (const key of Object.keys(defaults)) {
      if (values[key] !== defaults[key]) (diff[section] ??= {})[key] = values[key]
    }
  }
  return diff
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(param: string): string {
  const base64 = param.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

/** Encode a design for the `c` URL parameter. */
export function encodeShareParam(config: EyewearConfig): string {
  return toBase64Url(JSON.stringify(diffFromDefaults(config)))
}

/** Decode a `c` parameter; returns null when it is unreadable. */
export function decodeShareParam(param: string): EyewearConfig | null {
  try {
    return sanitizeConfig(JSON.parse(fromBase64Url(param)))
  } catch {
    return null
  }
}

/** Full share URL, e.g. https://…/eyewear-configurator/#/configure?c=… */
export function buildShareUrl(config: EyewearConfig, pageUrl: string): string {
  const base = pageUrl.split('#')[0]
  return `${base}#/configure?c=${encodeShareParam(config)}`
}

/** Read the `c` parameter from a location hash such as "#/configure?c=…". */
export function readShareParam(hash: string): string | null {
  const query = hash.split('?')[1]
  return query ? new URLSearchParams(query).get('c') : null
}

// ---------- Design number ----------

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ' // Crockford base 32: no I, L, O, U

/**
 * A short code that names a design, e.g. "EY-7K3QX", engraved inside the
 * right temple. The same design always gets the same code; any change gives a
 * new one. The code itself is not part of the hash, so engraving it is stable.
 */
export function designCode(config: EyewearConfig): string {
  const text = encodeShareParam(config)
  let h = 0x811c9dc5 // FNV-1a
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += ALPHABET[h & 31]
    h >>>= 5
  }
  return `EY-${code}`
}
