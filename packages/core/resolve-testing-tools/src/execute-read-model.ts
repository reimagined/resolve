import { Phases, symbol } from './constants'
import { CreateQueryOptions } from '@reimagined/runtime'
import { initDomain } from '@reimagined/core'

export const executeReadModel = async ({
  promise,
  createQuery,
  transformEvents,
}: {
  promise: any
  createQuery: (options: CreateQueryOptions) => any
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
  const provideLedger = async (ledger: any): Promise<void> => {
    /* nop */
  }
  const secretsManager = promise[symbol].secretsManager

  const domain = initDomain({
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
    aggregates: [],
    sagas: [],
  })

  try {
    queryExecutor = createQuery({
      readModelConnectors: {
        ADAPTER_NAME: promise[symbol].adapter,
      },
      getVacantTimeInMillis: () => 0x7fffffff,
      performAcknowledge,
      readModelsInterop: domain.readModelDomain.acquireReadModelsInterop({
        secretsManager,
        monitoring: {},
      }),
      viewModelsInterop: {},
      invokeEventBusAsync: () => {
        /* empty */
      },
      performanceTracer: null,
      provideLedger,
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

    const { data } = await queryExecutor.read({
      modelName: promise[symbol].name,
      resolverName: promise[symbol].resolverName,
      resolverArgs: promise[symbol].resolverArgs,
      jwt: promise[symbol].jwt,
    })

    promise[symbol].resolve(data)
  } catch (error) {
    promise[symbol].reject(error)
  } finally {
    if (queryExecutor) {
      await queryExecutor.dispose()
    }
  }
}
