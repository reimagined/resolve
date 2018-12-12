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

    const adapterCreators = readModelAdaptersCreators.filter(
      ({ name }) => name === readModel.adapterName
    )
    if (adapterCreators.length !== 1) {
      throw new Error(
        `${errors.wrongAdapter} in ${readModel.name}: ${readModel.adapterName}`
      )
    }

    const adapter = adapterCreators[0].factory({
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
