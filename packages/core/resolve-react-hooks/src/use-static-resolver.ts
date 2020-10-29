import { Resolver } from './generic'
import { useCallback } from 'react'
import { useClient } from './use-client'

export type StaticResolver = Resolver

const useStaticResolver = (): StaticResolver => {
  const client = useClient()

  return useCallback(
    (assetPath: string | string[]): string | string[] => {
      if (typeof assetPath === 'string') {
        return client.getStaticAssetUrl(assetPath)
      } else {
        return assetPath.map((path) => client.getStaticAssetUrl(path))
      }
    },
    [client]
  )
}

export { useStaticResolver }
