import { useContext, useMemo } from 'react'
import { Client, getClient } from 'resolve-client'
import { ResolveContext } from './context'

const useClient = (): Client => {
  const context = useContext(ResolveContext)
  if (context == null) {
    throw Error('ResolveContext.Provider value is required to use hooks')
  }
  return useMemo(() => getClient(context), [context])
}

export { useClient }
