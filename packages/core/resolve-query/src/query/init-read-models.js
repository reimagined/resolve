import { modelTypes, errors } from '../constants'

const initReadModels = ({
  createReadModel,
  executors,
  executorTypes,
  errorMessages,
  eventStore,
  readModelAdaptersCreators,
  readModels
}) => {
  for (const readModel of readModels) {
    if (executors.has(readModel.name)) {
      errorMessages.push(`${errors.duplicateName} ${readModel}`)
    }

    const adapterCreator = readModelAdaptersCreators.find(
      ({ name }) => name === readModel.adapterName
    )
    if (adapterCreator == null) {
      throw new Error(
        `${errors.missingAdapter} ${readModel.name}: ${readModel.adapterName}`
      )
    }

    const adapter = adapterCreator.factory({
      metaName: `__ResolveMeta__${readModel.name}`
    })

    const executor = createReadModel({
      projection: readModel.projection,
      resolvers: readModel.resolvers,
      adapter,
      eventStore
    })

    executors.set(readModel.name, executor)
    executorTypes.set(executor, modelTypes.readModel)
  }
}

export default initReadModels
