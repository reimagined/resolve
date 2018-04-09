import executeViewModelQuery from './execute_view_model_query'
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

    const result = await executeViewModelQuery({
      modelName: req.params.modelName,
      jwtToken: req.jwtToken,
      aggregateIds
    })

    res.status(200).json(result)
  } catch (err) {
    res.status(500).end(`${message.viewModelFail}${err.message}`)
    println.error(err)
  }
}

export default viewModelHandler
