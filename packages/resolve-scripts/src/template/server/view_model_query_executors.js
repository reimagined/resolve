import { createViewModel, createFacade } from 'resolve-query'
import eventStore from './event_store'
import raiseError from './utils/raise_error'
import message from './constants/message'

const viewModels = require($resolve.viewModels)

const viewModelQueryExecutors = {}

viewModels.forEach(viewModel => {
  if (!viewModel.name) {
    raiseError(message.viewModelMandatoryName, viewModel)
  } else if (viewModelQueryExecutors[viewModel.name]) {
    raiseError(message.dublicateName, viewModel)
  }

  if (!viewModel.serializeState || !viewModel.deserializeState) {
    raiseError(message.viewModelSerializable, viewModel)
  }

  viewModelQueryExecutors[viewModel.name] = createFacade({
    model: createViewModel({
      projection: viewModel.projection,
      eventStore
    }),
    customResolvers: {
      view: async (model, aggregateIds, jwtToken) =>
        await viewModel.serializeState(await model(aggregateIds), jwtToken)
    }
  }).executeQueryCustom.bind(null, 'view')
})

export default viewModelQueryExecutors
