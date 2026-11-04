import { createContext, useContext, type Dispatch } from 'react'
import { DEFAULT_CONFIG, type EyewearConfig, type Section } from './config'
import type { DesignAction } from './reducer'
import type { GlassesMeasurement } from './sizes'

export const DesignContext = createContext<{
  config: EyewearConfig
  dispatch: Dispatch<DesignAction>
}>({ config: DEFAULT_CONFIG, dispatch: () => {} })

/** Current glasses design plus typed helpers to change it. */
export function useDesign() {
  const { config, dispatch } = useContext(DesignContext)
  return {
    config,
    dispatch,
    patch: <S extends Section>(section: S, values: Partial<EyewearConfig[S]>) =>
      dispatch({ type: 'patch', section, values } as DesignAction),
    fromGlasses: (measurement: GlassesMeasurement) => dispatch({ type: 'fromGlasses', measurement }),
    newPattern: () => dispatch({ type: 'newPattern', seed: Math.floor(Math.random() * 10000) }),
    load: (input: unknown) => dispatch({ type: 'load', config: input }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
