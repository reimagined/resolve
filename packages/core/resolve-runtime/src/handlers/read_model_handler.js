import extractErrorHttpCode from '../utils/extract_error_http_code'
import message from '../message'

const readModelHandler = async (req, res) => {
  try {
    const executeQuery = req.resolve.executeQuery
    const { modelName, modelOptions: resolverName } = req.params
    const resolverArgs = req.arguments
    const jwtToken = req.jwtToken
    const queryArgs = { modelName, resolverName, resolverArgs, jwtToken }

    const result = await executeQuery.readAndSerialize(queryArgs)

    await res.status(200)
    await res.setHeader('Content-Type', 'application/json')
    await res.end(result)

    resolveLog('debug', 'Read model handler successful', req.path)
  } catch (err) {
    const errorCode = extractErrorHttpCode(err)
    await res.status(errorCode)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(`${message.readModelFail}${err.message}`)

    resolveLog('error', 'Read model handler failure', err)
  }
}

export default readModelHandler
