import { DEFAULT_CONFIG, RANGES, SHAPE_LENS_HEIGHT, type EyewearConfig, type Section } from './config'
import { clampToRange, sanitizeConfig } from './sanitize'
import { frameWidthFor, type GlassesMeasurement } from './sizes'

export type DesignAction =
  | { [S in Section]: { type: 'patch'; section: S; values: Partial<EyewearConfig[S]> } }[Section]
  /** Fill the fit from the size code of the user's own glasses */
  | { type: 'fromGlasses'; measurement: GlassesMeasurement }
  | { type: 'newPattern'; seed: number }
  | { type: 'load'; config: unknown }
  | { type: 'reset' }

export function designReducer(state: EyewearConfig, action: DesignAction): EyewearConfig {
  switch (action.type) {
    case 'reset':
      return structuredClone(DEFAULT_CONFIG)

    case 'load':
      return sanitizeConfig(action.config)

    case 'fromGlasses': {
      const { lensWidth, bridge, templeLength } = action.measurement
      // The bridge is clamped first, so the frame width keeps the measured lens width where it can
      const fitBridge = clampToRange(bridge, RANGES.fit.bridge)
      const frameWidth = frameWidthFor(lensWidth, fitBridge, state.fit.rimWidth)
      return sanitizeConfig({
        ...state,
        fit: { ...state.fit, frameWidth, bridge: fitBridge, templeLength },
      })
    }

    case 'newPattern':
      return sanitizeConfig({ ...state, texture: { ...state.texture, seed: action.seed } })

    case 'patch': {
      const next = {
        ...state,
        [action.section]: { ...state[action.section], ...action.values },
      } as EyewearConfig

      // A new shape brings the lens height that suits it (PLAN.md §4.2)
      if (next.shape.frame !== state.shape.frame && action.section === 'shape') {
        next.fit = { ...next.fit, lensHeight: SHAPE_LENS_HEIGHT[next.shape.frame] }
      }

      return sanitizeConfig(next)
    }
  }
}
