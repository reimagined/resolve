import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express'

import type { ResolveRequest, ResolveResponse } from '@resolve-js/runtime-base'
import { Monitoring } from '@resolve-js/core'
import { createResponse, INTERNAL } from '@resolve-js/http-stack'

export const wrapApiHandler = (
  handler: (req: ResolveRequest, res: ResolveResponse) => Promise<void>,
  getCustomParameters?: Function,
  monitoring?: Monitoring
) => async (expressReq: ExpressRequest, expressRes: ExpressResponse) => {
  const startTimestamp = Date.now()
  let apiMonitoring = monitoring?.group({ Part: 'ApiHandler' })
  let executionError: Error | undefined

  try {
    const customParameters =
      typeof getCustomParameters === 'function'
        ? await getCustomParameters(expressReq, expressRes)
        : {}

    const req = await createRequest(expressReq, customParameters)
    const res = createResponse()

    if (apiMonitoring != null) {
      apiMonitoring = apiMonitoring
        .group({ Path: req.path })
        .group({ Method: req.method })

      apiMonitoring.time('Execution', startTimestamp)
    }

    //TODO: explicitly set resolve to req object instead of customParameters? Or write a templated getCustomParameters
    await handler(req as ResolveRequest, res)

    const { status, headers, cookies, body } = res[INTERNAL]
    expressRes.status(status)
    headers['Set-Cookie'] = cookies
    expressRes.set(headers)
    expressRes.end(body)
  } catch (error) {
    executionError = error

    const outError =
      error != null && error.stack != null
        ? `${error.stack}`
        : `Unknown error ${error}`

    // eslint-disable-next-line no-console
    console.error(outError)

    expressRes.status(500).end('')
  } finally {
    if (apiMonitoring != null) {
      apiMonitoring.execution(executionError)
      apiMonitoring.timeEnd('Execution')
    }
  }
}
