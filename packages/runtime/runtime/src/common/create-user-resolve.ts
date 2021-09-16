import type { Runtime } from './create-runtime'
import type { BuildTimeConstants, UserBackendResolve } from './types'
import { Trie } from 'route-trie'

// TODO: review/refactor/rename - do something with that already
export type AdditionalUserData = {
  constants: BuildTimeConstants
  routesTrie: Trie
}

export const createUserResolve = (
  runtime: Runtime,
  additionalContext: AdditionalUserData
): UserBackendResolve => {
  return {
    ...runtime,
    ...additionalContext.constants,
    routesTrie: additionalContext.routesTrie
  }
}
