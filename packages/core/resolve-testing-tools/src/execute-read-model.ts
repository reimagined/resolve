import { Phases, symbol } from './constants'

export const executeReadModel = async ({
  promise,
  createQuery,
  transformEvents
}: {
  promise: any
  createQuery: Function
  transformEvents: Function
}): Promise<any> => {
  if (promise[symbol].phase < Phases.RESOLVER) {
    throw new TypeError(promise[symbol].phase)
  }

  let queryExecutor = null
  try {
    queryExecutor = createQuery({
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
      getRemainingTimeInMillis: () => 0x7fffffff,
      snapshotAdapter: null,
      eventstoreAdapter: {
        getSecretsManager: (): any => promise[symbol].secretsManager
      }
    })

    let updateResult = null
    try {
      updateResult = await queryExecutor.sendEvents({
        modelName: promise[symbol].name,
        events: transformEvents(promise[symbol].events)
      })
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
      jwt: promise[symbol].jwt
    })

    promise[symbol].resolve(result)
  } catch (error) {
    promise[symbol].reject(error)
  } finally {
    if (queryExecutor) {
      await queryExecutor.dispose()
    }
  }
}
