import { modelTypes, errors } from '../constants'

const initReadModels = ({
  createReadModel,
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

    const executor = createReadModel({
      projection: readModel.projection,
      resolvers: readModel.resolvers,
      adapter: readModelAdapters[readModel.adapterName],
      readModelName: readModel.name,
      eventStore
    })

    executors.set(readModel.name, executor)
    executorTypes.set(executor, modelTypes.readModel)
  }
}

export default initReadModels
