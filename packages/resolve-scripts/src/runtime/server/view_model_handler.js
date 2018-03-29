import viewModelQueryExecutors from './view_model_query_executors'
import println from './utils/println'

const message = require('../../../configs/message.json')

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
    const result = await executor(
      'view',
      { jwtToken: req.jwtToken },
      { aggregateIds: req.query.aggregateIds }
    )

    res.status(200).json(result)
  } catch (err) {
    res.status(500).end(`${message.viewModelFail}${err.message}`)
    println.error(err)
  }
}

export default viewModelHandler
