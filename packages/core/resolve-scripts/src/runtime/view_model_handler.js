import println from './utils/println'
import queryExecutor from './query_executor'
import extractErrorHttpCode from './utils/extract_error_http_code'

const message = require('../../configs/message.json')

const viewModelHandler = async (req, res) => {
  try {
    const modelName = req.params.modelName
    const aggregateIds =
      req.params.modelOptions !== '*' ? req.params.modelOptions.split(/,/) : '*'
    const aggregateArgs = req.arguments
    const jwtToken = req.jwtToken

    if (
      aggregateIds !== '*' &&
      (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
    ) {
      throw new Error(message.viewModelOnlyOnDemand)
    }

    const serializedState = await queryExecutor.readAndSerialize({
      modelName,
      aggregateIds,
      aggregateArgs,
      jwtToken
    })

    const lastError = await queryExecutor.getLastError({
      modelName,
      aggregateIds
    })
    if (lastError != null) {
      println.error(lastError.message)
      throw lastError
    }

    res.status(200).send(serializedState)
  } catch (err) {
    const errorCode = extractErrorHttpCode(err)
    res.status(errorCode).end(`${message.viewModelFail}${err.message}`)
    println.error(err)
  }
}

export default viewModelHandler
