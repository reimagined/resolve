import { modelTypes, errors } from './constants'

const initCustomReadModels = ({
  executors,
  executorTypes,
  errorMessages,
  eventStore,
  customReadModels
}) => {
  for (const customReadModel of customReadModels) {
    if (executors.has(customReadModel.name)) {
      errorMessages.push(`${errors.duplicateName} ${customReadModel}`)
    }

    const pool = { eventStore, readModelName: customReadModel.name }
    const executor = Object.freeze({
      getLastError: customReadModel.getLastError.bind(null, pool),
      updateByEvents: customReadModel.updateByEvents.bind(null, pool),
      readAndSerialize: customReadModel.readAndSerialize.bind(null, pool),
      read: customReadModel.read.bind(null, pool),
      dispose: customReadModel.dispose.bind(null, pool)
    })

    executors.set(customReadModel.name, executor)
    executorTypes.set(executor, modelTypes.readModel)
  }
}

export default initCustomReadModels
