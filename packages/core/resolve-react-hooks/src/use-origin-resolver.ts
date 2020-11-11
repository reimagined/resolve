import { Resolver } from './generic'
import { useCallback } from 'react'
import { useClient } from './use-client'

export type OriginResolver = Resolver

function useOriginResolver(): OriginResolver {
  const client = useClient()

  return useCallback(
    (relativePath: string): string => {
      if (relativePath != null) {
        return client.getOriginPath(relativePath)
      } else {
        throw Error(`unsupported or empty relative path: ${relativePath}`)
      }
    },
    [client]
  )
}

export { useOriginResolver }
