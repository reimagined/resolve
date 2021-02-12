import { Phases, symbol } from './constants'
import { CreateQueryOptions } from 'resolve-runtime'
import { initDomain } from 'resolve-core'

export const executeReadModel = async ({
  promise,
  createQuery,
  transformEvents,
  detectConnectorFeatures,
  connectorModes,
}: {
  promise: any
  createQuery: (options: CreateQueryOptions) => any
  transformEvents: Function
  detectConnectorFeatures: any
  connectorModes: any
}): Promise<any> => {
  if (promise[symbol].phase < Phases.RESOLVER) {
    throw new TypeError(promise[symbol].phase)
  }

  let queryExecutor = null
  let performAcknowledge = null
  const acknowledgePromise: Promise<any> = new Promise((resolve) => {
    performAcknowledge = async (result: any) => await resolve(result)
  })

  const provideLedger = async (ledger: any): Promise<void> => void 0
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
    const eventstoreAdapter = {
      getSecretsManager: (): any => promise[symbol].secretsManager,
      loadEvents: async () => ({
        events: transformEvents(promise[symbol].events),
        get cursor() {
          throw new Error(
            'Cursor should not be accessed from resolve-testing-tools'
          )
        },
      }),
      getNextCursor: () => 'SHIFT_CURSOR',
    }

    queryExecutor = createQuery({
      readModelConnectors: {
        ADAPTER_NAME: promise[symbol].adapter,
      },
      getVacantTimeInMillis: () => 0x7fffffff,
      invokeEventBusAsync: async () => void 0,
      eventstoreAdapter,
      performAcknowledge,
      readModelsInterop: domain.readModelDomain.acquireReadModelsInterop({
        secretsManager,
        monitoring: {},
      }),
      viewModelsInterop: {},
      performanceTracer: null,
      provideLedger,
    })
    const isInlineLedger =
      (await detectConnectorFeatures(promise[symbol].adapter)) ===
      connectorModes.INLINE_LEDGER_CONNECTOR
    const errors = []

    try {
      if (isInlineLedger) {
        await queryExecutor.subscribe({
          modelName: promise[symbol].name,
          subscriptionOptions: {
            eventTypes: null,
            aggregateIds: null,
          },
        })

        await queryExecutor.build({
          modelName: promise[symbol].name,
        })

        await queryExecutor.build({
          modelName: promise[symbol].name,
        })

        const status = await queryExecutor.status({
          modelName: promise[symbol].name,
        })
        if (status.status === 'error') {
          const error = new Error(
            ...(Array.isArray(status.errors)
              ? [status.errors.map((err: any) => err.message).join('\n')]
              : [])
          )
          error.stack = Array.isArray(status.errors)
            ? status.errors.map((err: any) => err.stack).join('\n')
            : error.stack
          throw error
        }
      } else {
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
      }
    } catch (err) {
      errors.push(err)
    }

    let result = null
    try {
      void ({ data: result } = await queryExecutor.read({
        modelName: promise[symbol].name,
        resolverName: promise[symbol].resolverName,
        resolverArgs: promise[symbol].resolverArgs,
        jwt: promise[symbol].jwt,
      }))
    } catch (err) {
      errors.push(err)
    }

    try {
      if (isInlineLedger) {
        await queryExecutor.unsubscribe({
          modelName: promise[symbol].name,
        })
      } else {
        await queryExecutor.drop({
          modelName: promise[symbol].name,
        })
      }
    } catch (err) {
      errors.push(err)
    }

    if (errors.length > 0) {
      const error = new Error(errors.map((err) => err.message).join('\n'))
      error.stack = errors.map((err) => err.stack).join('\n')
      throw error
    }

    promise[symbol].resolve(result)
  } catch (error) {
    promise[symbol].reject(error)
  } finally {
    if (queryExecutor != null) {
      await queryExecutor.dispose()
    }
  }
}
