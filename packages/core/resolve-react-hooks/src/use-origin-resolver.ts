import { Resolver } from './generic'
import { useCallback } from 'react'
import { useClient } from './use-client'

export type OriginResolver = Resolver

const useOriginResolver = (): OriginResolver => {
  const client = useClient()

  return useCallback(
    (assetPath: string | string[]): string | string[] => {
      if (typeof assetPath === 'string') {
        return client.getOriginPath(assetPath)
      } else {
        return assetPath.map((path) => client.getOriginPath(path))
      }
    },
    [client]
  )
}

export { useOriginResolver }
