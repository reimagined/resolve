import executeViewModelQuery from './execute_view_model_query'
import println from './utils/println'
import viewModelQueryExecutors from './view_model_query_executors'

const message = require('../../../configs/message.json')

const viewModelHandler = async (req, res) => {
  try {
    const aggregateIds = req.query.aggregateIds
    const aggregateArgs = req.query.aggregateArgs
    if (
      aggregateIds !== '*' &&
      (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
    ) {
      throw new Error(message.viewModelOnlyOnDemand)
    }

    const {
      state,
      aggregateVersionsMap
    } = await executeViewModelQuery({
      modelName: req.params.modelName,
      aggregateIds,
      aggregateArgs
    })

    const serializedState = viewModelQueryExecutors[
      req.params.modelName
    ].serializeState(state, req.jwtToken)

    res.status(200).json({
      serializedState,
      aggregateVersionsMap
    })
  } catch (err) {
    res.status(500).end(`${message.viewModelFail}${err.message}`)
    println.error(err)
  }
}

export default viewModelHandler
