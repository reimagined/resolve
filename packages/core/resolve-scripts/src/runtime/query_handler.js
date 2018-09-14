import { constants } from 'resolve-query'

import readModelHandler from './read_model_handler'
import viewModelHandler from './view_model_handler'
import queryExecutor from './query_executor'
import println from './utils/println'

const { modelTypes } = constants

const message = require('../../configs/message.json')

const queryHandler = (req, res) => {
  let modelType = null

  try {
    const { modelName } = req.params
    modelType = queryExecutor.getModelType(modelName)
  } catch (error) {
    res.status(422).end(message.incorrectQuery)
    println.error(error)
    return
  }

  if (modelType === modelTypes.viewModel) {
    viewModelHandler(req, res)
  } else if (modelType === modelTypes.readModel) {
    readModelHandler(req, res)
  } else {
    res.status(422).end(message.incorrectQuery)
  }
}

export default queryHandler
