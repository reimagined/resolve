import readModelQueryExecutors from './read_model_query_executors'
import message from './constants/message'
import println from './utils/println'

const readModelNonReactiveHandler = async (req, res) => {
  const serialId = Date.now()

  try {
    const result = await readModelQueryExecutors[req.params.modelName](
      req.params.resolverName,
      req.body.variables,
      req.jwtToken
    )
    res.status(200).send({
      serialId,
      result
    })
  } catch (err) {
    res.status(500).end(`${message.readModelFail}${err.message}`)
    println.error(err)
  }
}

export default readModelNonReactiveHandler
