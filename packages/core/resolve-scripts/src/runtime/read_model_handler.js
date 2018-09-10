import println from './utils/println'
import queryExecutor from './query_executor'

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
    res.status(500).end(`${message.readModelFail}${err.message}`)
    println.error(err)
  }
}

export default readModelHandler
