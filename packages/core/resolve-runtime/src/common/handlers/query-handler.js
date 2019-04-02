import extractErrorHttpCode from '../utils/extract-error-http-code'
import getRootBasedUrl from '../utils/get-root-based-url'
import extractRequestBody from '../utils/extract-request-body'

const queryHandler = async (req, res) => {
  try {
    const baseQueryUrl = getRootBasedUrl(req.resolve.rootPath, '/api/query/')
    const paramsPath = req.path.substring(baseQueryUrl.length)
    const [modelName, modelOptions] = paramsPath.split('/')

    if (modelName == null || modelOptions == null) {
      throw new Error('Invalid "modelName" and/or "modelOptions" parameters')
    }

    const result = await req.resolve.executeQuery.readAndSerialize({
      modelName,
      modelOptions,
      modelArgs: extractRequestBody(req),
      jwtToken: req.jwtToken
    })

    await res.status(200)
    await res.setHeader('Content-Type', 'application/json')
    await res.end(result)
  } catch (error) {
    const errorCode = extractErrorHttpCode(error)
    await res.status(errorCode)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(error.message)
  }
}

export default queryHandler
