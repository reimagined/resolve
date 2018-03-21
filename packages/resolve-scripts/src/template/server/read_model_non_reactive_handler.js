import readModelQueryExecutors from './read_model_query_executors'
import message from './constants/message'
import println from './utils/println'

const readModelHandler = async (req, res) => {
  try {
    const executor = readModelQueryExecutors[req.params.modelName]
    const data = await executor(
      req.body.query,
      req.body.variables || {},
      req.jwtToken
    )
    res.status(200).send({ data })
  } catch (err) {
    res.status(500).end(`${message.readModelFail}${err.message}`)
    // eslint-disable-next-line no-console
    println.error(err)
  }
}

export default readModelHandler
