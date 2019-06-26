import { Phases, symbol } from './constants'

const init = async ({ promise, createQuery, transformEvents }) => {
  if (promise[symbol].phase < Phases.RESOLVER) {
    throw new TypeError()
  }

  let queryExecutor = null
  try {
    queryExecutor = createQuery({
      doUpdateRequest: Promise.resolve.bind(Promise),
      eventStore: null,
      viewModels: [],
      readModels: [
        {
          name: promise[symbol].name,
          projection: promise[symbol].projection,
          resolvers: promise[symbol].resolvers,
          connectorName: 'ADAPTER_NAME'
        }
      ],
      readModelConnectors: {
        ADAPTER_NAME: promise[symbol].adapter
      },
      snapshotAdapter: null
    })

    let updateResult = null
    try {
      updateResult = await queryExecutor.updateByEvents(
        promise[symbol].name,
        transformEvents(promise[symbol].events)
      )
    } catch (error) {
      updateResult = error
    }

    if (updateResult != null && updateResult.lastError != null) {
      throw updateResult.lastError
    }

    const result = await queryExecutor.read({
      modelName: promise[symbol].name,
      resolverName: promise[symbol].resolverName,
      resolverArgs: promise[symbol].resolverArgs,
      jwtToken: promise[symbol].jwtToken
    })

    promise[symbol].resolve(result)
  } catch (error) {
    promise[symbol].reject(error)
  } finally {
    await queryExecutor.dispose()
  }
}

export default init
