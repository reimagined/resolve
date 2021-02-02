import { Resolver } from './generic'
import { useCallback } from 'react'
import { useClient } from './use-client'

export type StaticResolver = Resolver

function useStaticResolver(): StaticResolver {
  const client = useClient()

  return useCallback(
    (assetPath: string): string => {
      if (assetPath != null) {
        return client.getStaticAssetUrl(assetPath)
      } else {
        throw Error(`unsupported or empty asset path: ${assetPath}`)
      }
    },
    [client]
  )
}

export { useStaticResolver }
