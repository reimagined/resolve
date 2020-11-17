import { Phases, symbol } from './constants'

export const executeReadModel = async ({
  promise,
  createQuery,
  transformEvents,
}: {
  promise: any
  createQuery: Function
  transformEvents: Function
}): Promise<any> => {
  if (promise[symbol].phase < Phases.RESOLVER) {
    throw new TypeError(promise[symbol].phase)
  }

  let queryExecutor = null
  let performAcknowledge = null
  const acknowledgePromise: Promise<any> = new Promise(
    (resolve) =>
      (performAcknowledge = async (result: any) => await resolve(result))
  )

  try {
    queryExecutor = createQuery({
      viewModels: [],
      readModels: [
        {
          name: promise[symbol].name,
          projection: promise[symbol].projection,
          resolvers: promise[symbol].resolvers,
          connectorName: 'ADAPTER_NAME',
          encryption: promise[symbol].encryption,
        },
      ],
      readModelConnectors: {
        ADAPTER_NAME: promise[symbol].adapter,
      },
      getVacantTimeInMillis: () => 0x7fffffff,
      snapshotAdapter: null,
      eventstoreAdapter: {
        getSecretsManager: (): any => promise[symbol].secretsManager,
      },
      performAcknowledge,
    })

    await queryExecutor.sendEvents({
      modelName: promise[symbol].name,
      events: [{ type: 'Init' }],
    })

    await queryExecutor.sendEvents({
      modelName: promise[symbol].name,
      events: transformEvents(promise[symbol].events),
    })

    const {
      result: { error: projectionError },
    } = await acknowledgePromise
    if (projectionError != null) {
      const error = new Error(projectionError.message)
      error.stack = projectionError.stack
      throw error
    }

    const result = await queryExecutor.read({
      modelName: promise[symbol].name,
      resolverName: promise[symbol].resolverName,
      resolverArgs: promise[symbol].resolverArgs,
      jwt: promise[symbol].jwt,
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
