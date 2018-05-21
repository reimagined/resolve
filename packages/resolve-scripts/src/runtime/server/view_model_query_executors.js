import { createViewModel } from 'resolve-query'

import eventStore from './event_store'
import raiseError from './utils/raise_error'

import message from '../../../configs/message.json'

import viewModels from '$resolve.viewModels'

const viewModelQueryExecutors = {}

viewModels.forEach(viewModel => {
  if (!viewModel.name && viewModels.length === 1) {
    viewModel.name = 'reduxinitial'
  } else if (!viewModel.name) {
    raiseError(message.viewModelMandatoryName, viewModel)
  } else if (viewModelQueryExecutors[viewModel.name]) {
    raiseError(message.duplicateName, viewModel)
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
