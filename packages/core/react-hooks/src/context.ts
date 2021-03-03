import { createContext } from 'react'
import { Context } from '@resolve-js/client'

export const ResolveContext = createContext<Context | null>(null)

export function assertContext(
  context: Context | null
): asserts context is Context {
  if (context == null) {
    throw Error('ResolveContext.Provider value is required to use hooks')
  }
}
