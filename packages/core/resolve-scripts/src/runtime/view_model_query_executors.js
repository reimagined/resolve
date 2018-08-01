import { createViewModel } from 'resolve-query'

import eventStore from './event_store'
import raiseError from './utils/raise_error'

import { viewModels } from './assemblies'

const message = require('../../configs/message.json')

const viewModelQueryExecutors = {}

viewModels.forEach(viewModel => {
  if (!viewModel.name && viewModels.length === 1) {
    viewModel.name = 'reduxInitial'
  } else if (!viewModel.name) {
    raiseError(message.viewModelMandatoryName, viewModel)
  } else if (viewModelQueryExecutors[viewModel.name]) {
    raiseError(message.duplicateName, viewModel)
  }

  if (!viewModel.serializeState || !viewModel.deserializeState) {
    raiseError(message.viewModelSerializable, viewModel)
  }

  let snapshotAdapter, snapshotBucketSize
  if (viewModel.snapshotAdapter) {
    const createSnapshotAdapter = viewModel.snapshotAdapter.module
    const snapshotAdapterOptions = viewModel.snapshotAdapter.options

    snapshotAdapter = createSnapshotAdapter(snapshotAdapterOptions)
    snapshotBucketSize = snapshotAdapterOptions.bucketSize
  }

  const facade = createViewModel({
    projection: viewModel.projection,
    snapshotAdapter,
    snapshotBucketSize,
    eventStore
  })

  viewModelQueryExecutors[viewModel.name] = {
    read: facade.read,
    serializeState: viewModel.serializeState
  }
})

export default viewModelQueryExecutors
