import executeReadModelQuery from './execute_read_model_query'
import readModelQueryExecutors from './read_model_query_executors'
import println from './utils/println'

const message = require('../../../configs/message.json')

const readModelNonReactiveHandler = async (req, res) => {
  const { readModelName, resolverName, queryId, resolverArgs } = req.body

  try {
    const result = await executeReadModelQuery({
      jwtToken: req.jwtToken,
      modelName: readModelName,
      resolverName,
      resolverArgs
    })

    res.status(200).send({
      queryId,
      result
    })

    const lastError = await readModelQueryExecutors[
      readModelName
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
