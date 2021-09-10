import { getLog } from '../common/utils/get-log'
import type { Resolve, ResolveRequest, ResolveResponse } from '../common/types'
import { getRootBasedUrl } from '@resolve-js/core'

export const prepareDomain = (domain: Resolve['domain']): Resolve['domain'] => {
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
        await req.resolve.eventSubscriber.build({ eventSubscriber })
        await res.end('ok')
      } catch (error) {
        log.error(error)
        await res.end(error)
      }
    },
  })
  return domain
}
