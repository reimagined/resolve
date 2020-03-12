import { useContext, useCallback, useMemo } from 'react'
import { getClient } from 'resolve-client'
import { ResolveContext } from './context'

export type StaticResolver = (assetPath: string | string[]) => string | string[]

const useStaticResolver = (): StaticResolver => {
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use reSolve hooks outside Resolve context')
  }
  const client = useMemo(() => getClient(context), [context])

  return useCallback(
    (assetPath: string | string[]): string | string[] => {
      if (typeof assetPath === 'string') {
        return client.getStaticAssetUrl(assetPath)
      } else {
        return assetPath.map(path => client.getStaticAssetUrl(path))
      }
    },
    [client]
  )
}

export { useStaticResolver }
