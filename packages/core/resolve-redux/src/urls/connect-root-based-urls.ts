import getRootBasedUrl from './get-root-based-url'
import createContextBasedConnector from './create-context-based-connector'
import { useCallback, useContext } from 'react'
import { assertContext, ResolveContext } from 'resolve-react-hooks'

// TODO: push down to resolve-react-hooks and clean up this mess
const useRootResolver = () => {
  const context = useContext(ResolveContext)
  assertContext(context)

  const { origin, rootPath } = context

  return useCallback(
    (assetPath: string | string[]): string | string[] => {
      return getRootBasedUrl(origin, rootPath, assetPath)
    },
    [context]
  )
}

const connectRootBasedUrls = createContextBasedConnector(useRootResolver)

export { connectRootBasedUrls }
