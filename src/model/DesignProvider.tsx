import { useReducer, type ReactNode } from 'react'
import { DEFAULT_CONFIG, type EyewearConfig } from './config'
import { DesignContext } from './design-context'
import { designReducer } from './reducer'
import { decodeShareParam, readShareParam } from './serialize'

/**
 * Start from a shared design when the page was opened from a share link,
 * otherwise from the defaults. (Autosave of the working design comes with
 * the save and share step, PLAN.md §9 step 14.)
 */
function initialConfig(): EyewearConfig {
  const param = readShareParam(window.location.hash)
  return (param && decodeShareParam(param)) || structuredClone(DEFAULT_CONFIG)
}

export function DesignProvider({ children }: { children: ReactNode }) {
  const [config, dispatch] = useReducer(designReducer, undefined, initialConfig)
  return <DesignContext.Provider value={{ config, dispatch }}>{children}</DesignContext.Provider>
}
