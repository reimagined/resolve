import { createViewModel } from 'resolve-query'

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

  const facade = createViewModel({
    projection: viewModel.projection,
    snapshotAdapter: viewModel.snapshotAdapter,
    snapshotBucketSize: viewModel.snapshotBucketSize,
    eventStore
  })

  viewModelQueryExecutors[viewModel.name] = {
    read: facade.read,
    serializeState: viewModel.serializeState
  }
})

export default viewModelQueryExecutors
