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
      jwt: req.jwt
    })

    subSegment.addAnnotation('modelName', modelName)
    subSegment.addAnnotation('origin', 'resolve:query')

    res.status(200)
    res.setHeader('Content-Type', 'application/json')

    if (result?.__meta) {
      res.setHeader('X-Resolve-View-Model-Cursor', result.__meta.cursor)

      const subscribeOptions = await req.resolve.getSubscribeAdapterOptions(
        req.resolve,
        modelArgs.origin,
        result.__meta.eventTypes,
        // TODO: normalized aggregate ids somewhere above
        Array.isArray(modelOptions) ||
          modelOptions === '*' ||
          modelOptions == null
          ? modelOptions
          : [modelOptions]
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
        jwt: req.jwt
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
