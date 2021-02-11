import { Phases, symbol } from './constants'

export const executeReadModel = async ({
  promise,
  createQuery,
  transformEvents,
  detectConnectorFeatures,
  connectorModes
}: {
  promise: any
  createQuery: Function
  transformEvents: Function
  detectConnectorFeatures: any
  connectorModes: any
}): Promise<any> => {
  if (promise[symbol].phase < Phases.RESOLVER) {
    throw new TypeError(promise[symbol].phase)
  }

  let queryExecutor = null
  let performAcknowledge = null
  const acknowledgePromise: Promise<any> = new Promise(resolve => {
    performAcknowledge = async (result: any) => await resolve(result)
  })

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
      invokeEventBusAsync: async () => void 0,
      eventstoreAdapter: {
        getSecretsManager: (): any => promise[symbol].secretsManager,
        loadEvents: async () => ({
          events: transformEvents(promise[symbol].events),
          get cursor() {
            throw new Error('Cursor should not be accessed from resolve-testing-tools')
          }
        })
      },
      performAcknowledge,
    })
    const isInlineLedger = (await detectConnectorFeatures(promise[symbol].adapter)) === connectorModes.INLINE_LEDGER_CONNECTOR
    const errors = []

    try {
      if(isInlineLedger) {
        await queryExecutor.subscribe({
          modelName: promise[symbol].name,
          subscriptionOptions: {
            eventTypes: null,
            aggregateIds: null
          }
        })

        await queryExecutor.build({
          modelName: promise[symbol].name
        })

        await queryExecutor.build({
          modelName: promise[symbol].name
        })
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
    } catch(err) {
      errors.push(err)
    }

    let result = null
    try {
      result = await queryExecutor.read({
        modelName: promise[symbol].name,
        resolverName: promise[symbol].resolverName,
        resolverArgs: promise[symbol].resolverArgs,
        jwt: promise[symbol].jwt,
      })
    } catch(err) {
      errors.push(err)
    }
    
    try {
      if(isInlineLedger) {
        await queryExecutor.unsubscribe({
          modelName: promise[symbol].name
        })
      } else {
        await queryExecutor.drop({
          modelName: promise[symbol].name
        })
      }
    } catch(err) {
      errors.push(err)
    }
      
    if(errors.length > 0) {
      const error = new Error(errors.map(err => err.message).join('\n'))
      error.stack = errors.map(err => err.stack).join('\n')
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
