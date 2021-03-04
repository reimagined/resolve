import { useContext, useMemo } from 'react'
import { Client, getClient } from '@resolve-js/client'
import { assertContext, ResolveContext } from './context'

const useClient = (): Client => {
  const context = useContext(ResolveContext)
  assertContext(context)
  return useMemo(() => getClient(context), [context])
}

export { useClient }
