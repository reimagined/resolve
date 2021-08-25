import type {
  EventStoreOperationTimeLimitedMethodArguments,
  EventStoreOperationTimeLimitedMethodReturnType,
  EventStoreOperationTimeLimitedMethod,
  EventStoreAdapterAsyncFunctionKeys,
  EventStoreAdapterLike,
} from './types'

const eventStoreOperationTimeLimited: EventStoreOperationTimeLimitedMethod = async <
  E extends EventStoreAdapterLike,
  T extends EventStoreAdapterAsyncFunctionKeys
>(
  ...inputArgs: EventStoreOperationTimeLimitedMethodArguments<E, T>
): Promise<EventStoreOperationTimeLimitedMethodReturnType<E, T>> => {
  const [
    eventStoreAdapter,
    timeoutErrorProvider,
    getVacantTimeInMillis,
    methodName,
    ...args
  ] = inputArgs
  const eventStoreAdapterMethod = eventStoreAdapter[methodName]

  if (typeof eventStoreAdapterMethod !== 'function') {
    throw new Error('Invalid time limited event-store operation')
  }

  const eventStoreAdapterMethodResult = (eventStoreAdapterMethod as (
    ...realArgs: typeof args
  ) => Promise<EventStoreOperationTimeLimitedMethodReturnType<E, T>>)(...args)

  if (
    Promise.resolve(eventStoreAdapterMethodResult) !==
    eventStoreAdapterMethodResult
  ) {
    throw new Error('Invalid time limited event-store operation')
  }

  let vacantTimeout: ReturnType<typeof setTimeout> | null = null
  const racePromise = Promise.race([
    new Promise((_, reject) => {
      vacantTimeout = setTimeout(
        reject.bind(null, timeoutErrorProvider()),
        getVacantTimeInMillis()
      )
    }) as Promise<EventStoreOperationTimeLimitedMethodReturnType<E, T>>,
    eventStoreAdapterMethodResult.then((result) => {
      if (vacantTimeout != null) {
        clearTimeout(vacantTimeout)
        vacantTimeout = null
      }
      return result
    }),
  ])

  return await racePromise
}

export default eventStoreOperationTimeLimited
