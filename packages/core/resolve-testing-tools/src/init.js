import { Phases, symbol } from './constants'

const init = async ({ promise, createQuery, transformEvents }) => {
  if (promise[symbol].phase < Phases.RESOLVER) {
    throw new TypeError()
  }

  try {
    const queryExecutor = createQuery({
      doUpdateRequest: Function('return Promise.resolve()'),
      eventStore: null,
      viewModels: [],
      readModels: [
        {
          name: promise[symbol].name,
          projection: promise[symbol].projection,
          resolvers: promise[symbol].resolvers,
          adapterName: 'ADAPTER_NAME'
        }
      ],
      readModelAdapters: {
        ADAPTER_NAME: promise[symbol].adapter
      },
      snapshotAdapter: null
    })

    const executor = queryExecutor.getExecutor(promise[symbol].name)
    await executor.updateByEvents(transformEvents(promise[symbol].events))

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
