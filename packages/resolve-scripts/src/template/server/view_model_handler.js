import viewModelQueryExecutors from './view_model_query_executors'
import message from './constants/message'
import println from './utils/println'

const viewModelHandler = async (req, res) => {
  try {
    const aggregateIds = req.query.aggregateIds
    if (
      aggregateIds !== '*' &&
      (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
    ) {
      throw new Error(message.viewModelOnlyOnDemand)
    }
    const executor = viewModelQueryExecutors[req.params.modelName]
    const result = await executor(req.query.aggregateIds, req.jwtToken)
    res.status(200).json(result)
  } catch (err) {
    res.status(500).end(`${message.viewModelFail}${err.message}`)
    println.error(err)
  }
}

export default viewModelHandler
