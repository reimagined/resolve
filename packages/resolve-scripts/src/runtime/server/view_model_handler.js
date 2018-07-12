import executeViewModelQuery from './execute_view_model_query'
import println from './utils/println'
import viewModelQueryExecutors from './view_model_query_executors'

const message = require('../../../configs/message.json')

const viewModelHandler = async (req, res) => {
  try {
    const viewModelName = req.params.modelName
    const aggregateIds =
      req.params.modelOptions !== '*' ? req.params.modelOptions.split(/,/) : '*'
    const aggregateArgs = req.arguments

    if (
      aggregateIds !== '*' &&
      (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
    ) {
      throw new Error(message.viewModelOnlyOnDemand)
    }

    const { state, aggregateVersionsMap } = await executeViewModelQuery({
      modelName: viewModelName,
      aggregateIds,
      aggregateArgs
    })

    const serializedState = viewModelQueryExecutors[
      viewModelName
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
