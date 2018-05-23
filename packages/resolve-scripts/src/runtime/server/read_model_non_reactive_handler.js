import executeReadModelQuery from './execute_read_model_query'
import readModelQueryExecutors from './read_model_query_executors'
import println from './utils/println'

const message = require('../../../configs/message.json')

const readModelNonReactiveHandler = async (req, res) => {
  const serialId = Date.now()

  try {
    const result = await executeReadModelQuery({
      jwtToken: req.jwtToken,
      modelName: req.params.modelName,
      resolverName: req.params.resolverName,
      resolverArgs: req.body.parameters
    })

    res.status(200).send({
      serialId,
      result
    })

    const lastError = await readModelQueryExecutors[
      req.params.modelName
    ].getLastError()
    if (lastError != null) {
      println.error(lastError)
    }
  } catch (err) {
    res.status(500).end(`${message.readModelFail}${err.message}`)
    println.error(err)
  }
}

export default readModelNonReactiveHandler
