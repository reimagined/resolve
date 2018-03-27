import { createViewModel, createFacade } from 'resolve-query'

import eventStore from './event_store'
import raiseError from './utils/raise_error'

const message = require('../../../configs/message.json')

const viewModels = require($resolve.viewModels)

const viewModelQueryExecutors = {}

viewModels.forEach(viewModel => {
  if (!viewModel.name && viewModels.length === 1) {
    viewModel.name = 'reduxinitial'
  } else if (!viewModel.name) {
    raiseError(message.viewModelMandatoryName, viewModel)
  } else if (viewModelQueryExecutors[viewModel.name]) {
    raiseError(message.dublicateName, viewModel)
  }

  if (!viewModel.serializeState || !viewModel.deserializeState) {
    raiseError(message.viewModelSerializable, viewModel)
  }

  const facade = createFacade({
    model: createViewModel({
      projection: viewModel.projection,
      eventStore
    }),
    resolvers: {
      view: async (model, { jwtToken }) =>
        await viewModel.serializeState(model, jwtToken)
    }
  })

  viewModelQueryExecutors[viewModel.name] = facade.executeQuery

  viewModelQueryExecutors[viewModel.name].mode = 'view'
})

export default viewModelQueryExecutors
