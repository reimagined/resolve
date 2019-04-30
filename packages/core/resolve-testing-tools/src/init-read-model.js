import { Phases, symbol } from './constants'

const init = async ({ promise, createQuery, transformEvents }) => {
  if (promise[symbol].phase < Phases.RESOLVER) {
    throw new TypeError()
  }

  try {
    const queryExecutor = createQuery({
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

    await queryExecutor.updateByEvents(
      promise[symbol].name,
      transformEvents(promise[symbol].events)
    )

    const result = await queryExecutor.read({
      modelName: promise[symbol].name,
      resolverName: promise[symbol].resolverName,
      resolverArgs: promise[symbol].resolverArgs,
      jwtToken: promise[symbol].jwtToken
    })

    promise[symbol].resolve(result)
  } catch (error) {
    promise[symbol].reject(error)
  }
}

export default init
