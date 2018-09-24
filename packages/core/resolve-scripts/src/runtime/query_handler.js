import { constants } from 'resolve-query'

import readModelHandler from './read_model_handler'
import viewModelHandler from './view_model_handler'
import queryExecutor from './query_executor'

const { modelTypes } = constants

const message = require('../../configs/message.json')

const queryHandler = (req, res) => {
  const modelType = queryExecutor.getModelType(req.params.modelName)

  switch (modelType) {
    case modelTypes.viewModel:
      return viewModelHandler(req, res)
    case modelTypes.readModel:
      return readModelHandler(req, res)
    default:
      res.status(422).end(message.incorrectQuery)
  }
}

export default queryHandler
