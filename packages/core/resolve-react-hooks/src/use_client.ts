import { useContext, useMemo } from 'react'
import { Client, getClient } from 'resolve-client'
import { ResolveContext } from './index'

const useClient = (): Client => {
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use reSolve hooks outside Resolve context')
  }
  return useMemo(() => getClient(context), [context])
}

export { useClient }
