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

    const result = await req.resolve.executeQuery.readAndSerialize({
      modelName,
      modelOptions,
      modelArgs: extractRequestBody(req),
      jwtToken: req.jwtToken
    })

    subSegment.addAnnotation('modelName', modelName)
    subSegment.addAnnotation('origin', 'resolve:query')

    await res.status(200)
    await res.setHeader('Content-Type', 'application/json')
    await res.end(result)
  } catch (error) {
    const errorCode = extractErrorHttpCode(error)
    await res.status(errorCode)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(error.message)
    subSegment.addError(error)
  } finally {
    subSegment.close()
  }
}

export default queryHandler
