import type {
  EventstoreOperationTimeLimitedMethodArguments,
  EventstoreOperationTimeLimitedMethodReturnType,
  EventstoreOperationTimeLimitedMethod,
  EventStoreAdapterAsyncFunctionKeys,
  EventstoreAdapterLike,
} from './types'

const eventstoreOperationTimeLimited: EventstoreOperationTimeLimitedMethod = async <
  E extends EventstoreAdapterLike,
  T extends EventStoreAdapterAsyncFunctionKeys
>(
  ...inputArgs: EventstoreOperationTimeLimitedMethodArguments<E, T>
): Promise<EventstoreOperationTimeLimitedMethodReturnType<E, T>> => {
  const [
    eventstoreAdapter,
    timeoutErrorProvider,
    getVacantTimeInMillis,
    methodName,
    ...args
  ] = inputArgs
  const eventstoreAdapterMethod = eventstoreAdapter[methodName]
  if (typeof eventstoreAdapterMethod !== 'function') {
    throw new Error('Invalid time limited event-store operation')
  }

  const eventstoreAdapterMethodResult = (eventstoreAdapterMethod as (
    ...realArgs: typeof args
  ) => Promise<EventstoreOperationTimeLimitedMethodReturnType<E, T>>)(...args)
  if (
    Promise.resolve(eventstoreAdapterMethodResult) !==
    eventstoreAdapterMethodResult
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
    }) as Promise<EventstoreOperationTimeLimitedMethodReturnType<E, T>>,
    eventstoreAdapterMethodResult.then((result) => {
      if (vacantTimeout != null) {
        clearTimeout(vacantTimeout)
        vacantTimeout = null
      }
      return result
    }),
  ])

  return await racePromise
}

export default eventstoreOperationTimeLimited
