import { constants } from 'resolve-query'
import readModelHandler from './read_model_handler'
import viewModelHandler from './view_model_handler'
import queryExecutor from './query_executor'

const { modelTypes } = constants

const message = require('../../configs/message.json')

const queryHandler = (req, res) => {
  const { modelName } = req.params

  let modelType = null
  try {
    modelType = queryExecutor.getModelType(modelName)
  } catch (error) {
    res.status(422).end(message.incorrectQuery)
  }

  if (modelType === modelTypes.viewModel) {
    viewModelHandler(req, res)
  } else if (modelType === modelTypes.readModel) {
    readModelHandler(req, res)
  }
}

export default queryHandler
