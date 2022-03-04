import { getRootBasedUrl } from '@resolve-js/core'
import { extractErrorHttpCode, extractRequestBody } from '../utils'

import type { ResolveRequest, ResolveResponse } from '../types'

export const queryHandler = async (
  req: ResolveRequest,
  res: ResolveResponse
) => {
  const segment = req.resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('query')

  try {
    const baseQueryUrl = getRootBasedUrl(req.resolve.rootPath, '/api/query/')
    const paramsPath = req.path.substring(baseQueryUrl.length)
    const [modelName, modelOptions] = paramsPath.split('/')

    if (modelName == null || modelOptions == null) {
      const error = new Error(
        'Invalid "modelName" and/or "modelOptions" parameters'
      ) as any
      error.code = 400
      throw error
    }

    const modelArgs = extractRequestBody(req)

    const result = await req.resolve.executeQuery.read(
      {
        modelName,
        modelOptions,
        modelArgs,
        jwt: req.jwt,
      },
      // TODO ????
      { req: req as any, res }
    )

    subSegment.addAnnotation('modelName', modelName)
    subSegment.addAnnotation('origin', 'resolve:query')

    res.status(200)
    res.setHeader('Content-Type', 'application/json')

    if (
      (result.meta?.aggregateIds != null || result.meta?.eventTypes != null) &&
      modelArgs.origin != null
    ) {
      const { aggregateIds } = result.meta || {}

      const subscriptionAggregateIds =
        Array.isArray(aggregateIds) ||
        aggregateIds === '*' ||
        aggregateIds == null
          ? aggregateIds
          : [aggregateIds]

      const subscribeOptions = await req.resolve.getReactiveSubscription(
        modelArgs.origin,
        result.meta.eventTypes,
        subscriptionAggregateIds
      )

      res.setHeader(
        'X-Resolve-View-Model-Subscription',
        JSON.stringify(subscribeOptions)
      )
    }

    res.end(
      await req.resolve.executeQuery.serializeState({
        modelName,
        state: result,
        jwt: req.jwt,
      })
    )
  } catch (error) {
    const errorCode = extractErrorHttpCode(error)
    res.status(errorCode)
    res.setHeader('Content-Type', 'text/plain')
    res.end(error.message)
    subSegment.addError(error)
  } finally {
    subSegment.close()
  }
}
