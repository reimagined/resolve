import extractErrorHttpCode from '../utils/extract-error-http-code'
import getRootBasedUrl from '../utils/get-root-based-url'
import extractRequestBody from '../utils/extract-request-body'

const queryHandler = async (req, res) => {
  const segment = req.resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('query')

  try {
    const baseQueryUrl = getRootBasedUrl(req.resolve.rootPath, '/api/query/')
    const paramsPath = req.path.substring(baseQueryUrl.length)
    const [modelName, modelOptions] = paramsPath.split('/')

    if (modelName == null || modelOptions == null) {
      const error = new Error(
        'Invalid "modelName" and/or "modelOptions" parameters'
      )
      error.code = 400
      throw error
    }

    const modelArgs = extractRequestBody(req)

    const result = await req.resolve.executeQuery.read({
      modelName,
      modelOptions,
      modelArgs,
      jwt: req.jwt,
    })

    subSegment.addAnnotation('modelName', modelName)
    subSegment.addAnnotation('origin', 'resolve:query')

    res.status(200)
    res.setHeader('Content-Type', 'application/json')

    if (req.headers['x-resolve-query-origin'] != null) {
      const { aggregateIds, eventTypes, channelPermit } = result.meta || {}
      let subscription
      if (aggregateIds != null || eventTypes != null) {
        subscription = await req.resolve.makeSubscription(
          req.resolve,
          req.headers['x-resolve-query-origin'],
          {
            eventTypes,
            aggregateIds,
          }
        )
      } else if (channelPermit != null) {
        subscription = await req.resolve.makeSubscription(
          req.resolve,
          req.headers['x-resolve-query-origin'],
          channelPermit
        )
      }
      if (subscription != null) {
        res.setHeader(
          'X-Resolve-View-Model-Subscription',
          JSON.stringify(subscription)
        )
      }
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

export default queryHandler
