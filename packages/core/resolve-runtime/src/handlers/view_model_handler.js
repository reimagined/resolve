import extractErrorHttpCode from '../utils/extract_error_http_code'
import message from '../message'

const viewModelHandler = async (req, res) => {
  try {
    const executeQuery = req.resolve.executeQuery
    const modelName = req.params.modelName
    const aggregateIds =
      req.params.modelOptions !== '*' ? req.params.modelOptions.split(/,/) : '*'
    const aggregateArgs = req.arguments
    const jwtToken = req.jwtToken

    if (
      aggregateIds !== '*' &&
      (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
    ) {
      resolveLog(
        'warn',
        'View model handler wrong aggregate ids parameter',
        req.path,
        aggregateIds
      )
      throw new Error(message.viewModelOnlyOnDemand)
    }

    const serializedState = await executeQuery.readAndSerialize({
      modelName,
      aggregateIds,
      aggregateArgs,
      jwtToken
    })

    await res.status(200)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(serializedState)

    resolveLog('debug', 'View model handler successful', req.path)
  } catch (err) {
    const errorCode = extractErrorHttpCode(err)
    await res.status(errorCode)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(`${message.viewModelFail}${err.message}`)

    resolveLog('error', 'View model handler failure', err)
  }
}

export default viewModelHandler
