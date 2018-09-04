import viewModelHandler from './view_model_handler'
import readModelHandler from './read_model_handler'
import raiseError from './utils/raise_error'

import { viewModels, readModels } from './assemblies'

const message = require('../../configs/message.json')

const queryMap = new Map()

for (const readModel of readModels) {
  if (queryMap.has(readModel.name)) {
    raiseError(message.duplicateName, readModel)
  }

  queryMap.set(readModel.name, 'read')
}

for (const viewModel of viewModels) {
  if (queryMap.has(viewModel.name)) {
    raiseError(message.duplicateName, viewModel)
  }

  queryMap.set(viewModel.name, 'view')
}

const queryHandler = (req, res) => {
  const { modelName } = req.params
  switch (queryMap.get(modelName)) {
    case 'view':
      return viewModelHandler(req, res)

    case 'read':
      return readModelHandler(req, res)

    default:
      return res.status(422).end()
  }
}

export default queryHandler
