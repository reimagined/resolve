import println from './utils/println'
import queryExecutor from './query_executor'
import extractErrorHttpCode from './utils/extract_error_http_code'

const message = require('../../configs/message.json')

const readModelHandler = async (req, res) => {
  try {
    const { modelName, modelOptions: resolverName } = req.params
    const resolverArgs = req.arguments
    const jwtToken = req.jwtToken

    const result = await queryExecutor.readAndSerialize({
      modelName,
      resolverName,
      resolverArgs,
      jwtToken
    })

    const lastError = await queryExecutor.getLastError({ modelName })
    if (lastError != null) {
      println.error(lastError.message)
      throw lastError
    }

    res.status(200).send(result)
  } catch (err) {
    const errorCode = extractErrorHttpCode(err)
    res.status(errorCode).end(`${message.readModelFail}${err.message}`)
    println.error(err)
  }
}

export default readModelHandler
