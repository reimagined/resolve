import { getLog } from '@resolve-js/runtime-base'
import { getRootBasedUrl } from '@resolve-js/core'
import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'

import type {
  RuntimeFactoryParameters,
  UserBackendResolve,
} from '@resolve-js/runtime-base'

export const prepareDomain = (
  domain: RuntimeFactoryParameters['domain']
): RuntimeFactoryParameters['domain'] => {
  domain.apiHandlers.push({
    path: '/api/subscribers/:eventSubscriber',
    method: 'GET',
    handler: async (req: ResolveRequest, res: ResolveResponse) => {
      const log = getLog('local-entry:subscriber-api-handler')
      try {
        const baseQueryUrl = getRootBasedUrl(
          req.resolve.rootPath,
          '/api/subscribers/'
        )

        const eventSubscriber = req.path.substring(baseQueryUrl.length)
        // TODO ???
        await ((req.resolve as any) as UserBackendResolve).performBuild({
          eventSubscriber,
        } as any)
        await res.end('ok')
      } catch (error) {
        log.error(error)
        await res.end(error)
      }
    },
  })
  return domain
}
