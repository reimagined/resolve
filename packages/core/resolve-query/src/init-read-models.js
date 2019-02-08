import { modelTypes, errors } from './constants'

const initReadModels = ({
  executors,
  executorTypes,
  errorMessages,
  eventStore,
  readModels,
  readModelAdapters
}) => {
  for (const readModel of readModels) {
    if (executors.has(readModel.name)) {
      errorMessages.push(`${errors.duplicateName} ${readModel}`)
    }

    if (!readModelAdapters.hasOwnProperty(readModel.adapterName)) {
      throw new Error(
        `${errors.wrongAdapter} in ${readModel.name}: ${readModel.adapterName}`
      )
    }

    const adapter = readModelAdapters[readModel.adapterName]
    const executor = adapter.bindReadModel({
      readModelName: readModel.name,
      projection: readModel.projection,
      resolvers: readModel.resolvers,
      eventStore
    })

    executors.set(readModel.name, executor)
    executorTypes.set(executor, modelTypes.readModel)
  }
}

export default initReadModels
