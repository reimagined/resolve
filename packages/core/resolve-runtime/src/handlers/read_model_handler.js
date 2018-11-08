import println from '../utils/println'
import extractErrorHttpCode from '../utils/extract_error_http_code'

import message from '../message'

const readModelHandler = async (req, res) => {
  try {
    const executeQuery = req.resolve.executeQuery

    const { modelName, modelOptions: resolverName } = req.params
    const resolverArgs = req.arguments
    const jwtToken = req.jwtToken

    const result = await executeQuery.readAndSerialize({
      modelName,
      resolverName,
      resolverArgs,
      jwtToken
    })

    const lastError = await executeQuery.getLastError({ modelName })
    if (lastError != null) {
      println.error(lastError.message)
      throw lastError
    }

    await res.status(200)
    await res.end(result)
  } catch (err) {
    const errorCode = extractErrorHttpCode(err)
    await res.status(errorCode)
    await res.end(`${message.readModelFail}${err.message}`)
    println.error(err)
  }
}

export default readModelHandler
