import { modelTypes, errors } from '../constants'

const initViewModels = ({
  createViewModel,
  executors,
  executorTypes,
  errorMessages,
  eventStore,
  viewModels,
  snapshotAdapter
}) => {
  for (const viewModel of viewModels) {
    if (executors.has(viewModel.name)) {
      errorMessages.push(`${errors.duplicateName} "${viewModel}"`)
    }

    const executor = createViewModel({
      projection: viewModel.projection,
      invariantHash: viewModel.invariantHash,
      serializeState: viewModel.serializeState,
      deserializeState: viewModel.deserializeState,
      snapshotAdapter,
      eventStore
    })

    executors.set(viewModel.name, executor)
    executorTypes.set(executor, modelTypes.viewModel)
  }
}

export default initViewModels
