import { modelTypes, errors } from '../constants'

const initReadModels = ({
  createReadModel,
  executors,
  executorTypes,
  errorMessages,
  eventStore,
  readModels
}) => {
  for (const readModel of readModels) {
    if (executors.has(readModel.name)) {
      errorMessages.push(`${errors.duplicateName} ${readModel}`)
    }

    const executor = createReadModel({
      projection: readModel.projection,
      resolvers: readModel.resolvers,
      adapter: readModel.adapter(),
      eventStore
    })

    executors.set(readModel.name, executor)
    executorTypes.set(executor, modelTypes.readModel)
  }
}

export default initReadModels
