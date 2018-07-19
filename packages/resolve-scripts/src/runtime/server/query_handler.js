import viewModelHandler from './view_model_handler'
import readModelNonReactiveHandler from './read_model_non_reactive_handler'
import readModelReactiveHandlers from './read_model_reactive_handler'
import raiseError from './utils/raise_error'
import { stopSubscriptionArg, isReactiveArg } from './constants'

import { viewModels, readModels } from './resources'

const message = require('../../../configs/message.json')

const {
  readModelSubscribeHandler,
  readModelUnsubscribeHandler
} = readModelReactiveHandlers

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
    case 'view': {
      return viewModelHandler(req, res)
    }

    case 'read': {
      if (req.arguments.hasOwnProperty(stopSubscriptionArg)) {
        return readModelUnsubscribeHandler(req, res)
      } else if (req.arguments.hasOwnProperty(isReactiveArg)) {
        return readModelSubscribeHandler(req, res)
      } else {
        return readModelNonReactiveHandler(req, res)
      }
    }

    default: {
      return res.status(422).end()
    }
  }
}

export default queryHandler
