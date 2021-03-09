import { Phases, symbol } from './constants'
import { CreateQueryOptions } from '@resolve-js/runtime'
import { initDomain, Eventstore } from '@resolve-js/core'

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
  const errors = []
  let queryExecutor = null
  let result = null

  try {
    const provideLedger = async (ledger: any): Promise<void> => void 0
    const secretsManager = promise[symbol].secretsManager

    const liveErrors: Array<Error> = []
    const wrapProjectionLiveErrors = <T extends Record<string, Function>>(
      projection: T
    ): T =>
      (Object.keys(projection) as Array<keyof T>).reduce<T>(
        (acc, key) => ({
          ...acc,
          [key]: async (...args: any[]): Promise<any> => {
            try {
              return await projection[key](...args)
            } catch (error) {
              liveErrors.push(error)
              throw error
            }
          },
        }),
        {} as T
      ) as T

    const domain = initDomain({
      viewModels: [],
      readModels: [
        {
          name: promise[symbol].name,
          projection: wrapProjectionLiveErrors(promise[symbol].projection),
          resolvers: promise[symbol].resolvers,
          connectorName: 'ADAPTER_NAME',
          encryption: promise[symbol].encryption,
        },
      ],
      aggregates: [],
      sagas: [],
    })

    const eventStoreLocalState = new Map<
      string,
      { destination: any; status: any }
    >()

    const eventstoreAdapter = ({
      getSecretsManager: (): any => promise[symbol].secretsManager,
      loadEvents: async () => ({
        events: transformEvents(promise[symbol].events),
        get cursor() {
          throw new Error(
            'Cursor should not be accessed from @resolve-js/testing-tools'
          )
        },
      }),
      getNextCursor: () => 'SHIFT_CURSOR',
      ensureEventSubscriber: async ({
        applicationName,
        eventSubscriber,
        destination,
        status,
      }: any) => {
        eventStoreLocalState.set(`${applicationName}${eventSubscriber}`, {
          ...(eventStoreLocalState.has(`${applicationName}${eventSubscriber}`)
            ? (eventStoreLocalState.get(
                `${applicationName}${eventSubscriber}`
              ) as any)
            : {}),
          ...(destination != null ? { destination } : {}),
          ...(status != null ? { status } : {}),
        })
      },
      removeEventSubscriber: async ({
        applicationName,
        eventSubscriber,
      }: any) => {
        eventStoreLocalState.delete(`${applicationName}${eventSubscriber}`)
      },
      getEventSubscribers: async ({
        applicationName,
        eventSubscriber,
      }: any = {}) => {
        if (applicationName == null && eventSubscriber == null) {
          return [...eventStoreLocalState.values()]
        }
        const result = []
        for (const [
          key,
          { destination, status },
        ] of eventStoreLocalState.entries()) {
          if (`${applicationName}${eventSubscriber}` === key) {
            result.push({
              applicationName,
              eventSubscriber,
              destination,
              status,
            })
          }
        }
        return result
      },
    } as unknown) as Eventstore

    queryExecutor = createQuery({
      applicationName: 'APP_NAME',
      readModelConnectors: {
        ADAPTER_NAME: promise[symbol].adapter,
      },
      getVacantTimeInMillis: () => 0x7fffffff,
      invokeEventSubscriberAsync: async () => void 0,
      eventstoreAdapter,
      readModelsInterop: domain.readModelDomain.acquireReadModelsInterop({
        secretsManager,
        monitoring: {},
      }),
      viewModelsInterop: {},
      performanceTracer: null,
      provideLedger,
    })

    try {
      await eventstoreAdapter.ensureEventSubscriber({
        applicationName: 'APP_NAME',
        eventSubscriber: promise[symbol].name,
        status: null,
        destination: 'LOCAL',
      })

      await queryExecutor.subscribe({
        modelName: promise[symbol].name,
        subscriptionOptions: {
          eventTypes: null,
          aggregateIds: null,
        },
      })

      await queryExecutor.resume({
        modelName: promise[symbol].name,
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
        if (!Array.isArray(status.errors)) {
          throw new Error('Unknown error')
        }
        const liveErrorIndex =
          status.errors.length === 1
            ? liveErrors.findIndex(
                (err) => err.message === status.errors[0].message
              )
            : -1
        if (liveErrorIndex < 0) {
          const error = new Error(
            status.errors.map((err: any) => err.message).join('\n')
          )
          error.stack = status.errors.map((err: any) => err.stack).join('\n')
          throw error
        } else {
          throw liveErrors[liveErrorIndex]
        }
      }
    } catch (err) {
      errors.push(err)
    }

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
      await queryExecutor.unsubscribe({
        modelName: promise[symbol].name,
      })
    } catch (err) {
      errors.push(err)
    }

    try {
      await eventstoreAdapter.removeEventSubscriber({
        applicationName: 'APP_NAME',
        eventSubscriber: promise[symbol].name,
      })
    } catch (err) {
      errors.push(err)
    }
  } catch (error) {
    errors.push(error)
  } finally {
    if (queryExecutor != null) {
      try {
        await queryExecutor.dispose()
      } catch (err) {
        errors.push(err)
      }
    }
  }

  if (errors.length === 0) {
    promise[symbol].resolve(result)
  } else {
    let summaryError = errors[0]
    if (errors.length > 1) {
      summaryError = new Error(errors.map((err) => err.message).join('\n'))
      summaryError.stack = errors.map((err) => err.stack).join('\n')
    }
    // eslint-disable-next-line no-console
    console.error(summaryError)

    promise[symbol].reject(errors[0])
  }
}
