import { useContext, useCallback, useMemo } from 'react'
import { ResolveContext } from './context'
import { Event, firstOfType, SerializableMap } from 'resolve-core'
import { QueryOptions, SubscribeCallback, Subscription } from 'resolve-client'
import { useClient } from './use-client'
import { isCallback, isOptions, isSerializableMap } from './generic'

type StateChangedCallback = (state: any, initial: boolean) => void
type EventReceivedCallback = (event: Event) => void
type PromiseOrVoid<T> = Promise<T> | void

type Closure = {
  initialStateSent: boolean
  state?: any
  subscription?: Subscription
  url?: string
  cursor?: string
}

type ViewModelConnection = {
  connect: (done?: SubscribeCallback) => PromiseOrVoid<Subscription>
  dispose: (done?: (error?: Error) => void) => PromiseOrVoid<void>
}

function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  stateChangeCallback: StateChangedCallback
): ViewModelConnection
function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  args: SerializableMap,
  stateChangeCallback: StateChangedCallback
): ViewModelConnection
function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  args: SerializableMap,
  stateChangeCallback: StateChangedCallback,
  eventReceivedCallback: EventReceivedCallback
): ViewModelConnection
function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  stateChangeCallback: StateChangedCallback,
  eventReceivedCallback: EventReceivedCallback
): ViewModelConnection
function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  args: SerializableMap,
  stateChangeCallback: StateChangedCallback,
  queryOptions: QueryOptions
): ViewModelConnection
function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  stateChangeCallback: StateChangedCallback,
  queryOptions: QueryOptions
): ViewModelConnection
function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  args: SerializableMap,
  stateChangeCallback: StateChangedCallback,
  eventReceivedCallback: EventReceivedCallback,
  queryOptions: QueryOptions
): ViewModelConnection
function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  stateChangeCallback: StateChangedCallback,
  eventReceivedCallback: EventReceivedCallback,
  queryOptions: QueryOptions
): ViewModelConnection
function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  args: SerializableMap,
  stateChangeCallback: StateChangedCallback,
  eventReceivedCallback: EventReceivedCallback,
  queryOptions: QueryOptions
): ViewModelConnection
function useViewModel(
  modelName: string,
  aggregateIds: string[] | '*',
  args: SerializableMap | StateChangedCallback,
  stateChangeCallback?:
    | StateChangedCallback
    | QueryOptions
    | EventReceivedCallback,
  eventReceivedCallback?: QueryOptions | EventReceivedCallback,
  queryOptions?: QueryOptions
): ViewModelConnection {
  const context = useContext(ResolveContext)
  const client = useClient()

  const { viewModels } = context
  const viewModel = viewModels.find(({ name }) => name === modelName)

  if (!viewModel) {
    throw Error(`View model ${modelName} not exist within context`)
  }

  const actualArgs: SerializableMap | undefined = isSerializableMap(args)
    ? args
    : undefined
  const actualQueryOptions: QueryOptions | undefined = firstOfType<
    QueryOptions
  >(isOptions, stateChangeCallback, eventReceivedCallback, queryOptions)
  const actualStateChangeCallback:
    | StateChangedCallback
    | undefined = firstOfType<StateChangedCallback>(
    isCallback,
    args,
    stateChangeCallback
  )
  let actualEventReceivedCallback:
    | EventReceivedCallback
    | undefined = firstOfType<EventReceivedCallback>(
    isCallback,
    stateChangeCallback,
    eventReceivedCallback
  )
  actualEventReceivedCallback =
    actualEventReceivedCallback !== actualStateChangeCallback
      ? actualEventReceivedCallback
      : undefined

  if (!actualStateChangeCallback) {
    throw Error(`state change callback required`)
  }

  const closure = useMemo<Closure>(
    () => ({
      state: viewModel.projection.Init ? viewModel.projection.Init() : null,
      initialStateSent: false
    }),
    []
  )

  const setState = useCallback(state => {
    closure.state = state
    actualStateChangeCallback(closure.state, false)
  }, [])

  const queryState = useCallback(async () => {
    const result = await client.query(
      {
        name: modelName,
        aggregateIds,
        args: actualArgs
      },
      actualQueryOptions
    )
    if (result) {
      const { data, url, cursor } = result
      setState(data)
      closure.url = url
      closure.cursor = cursor
    }
  }, [])

  const applyEvent = useCallback(event => {
    if (isCallback<EventReceivedCallback>(actualEventReceivedCallback)) {
      actualEventReceivedCallback(event)
    }
    setState(viewModel.projection[event.type](closure.state, event))
  }, [])

  const connect = useCallback((done?: SubscribeCallback): PromiseOrVoid<
    Subscription
  > => {
    const asyncConnect = async (): Promise<Subscription> => {
      await queryState()

      const subscribe = client.subscribe(
        closure.url ?? '',
        closure.cursor ?? '',
        modelName,
        aggregateIds,
        event => applyEvent(event),
        undefined,
        () => queryState()
      ) as Promise<Subscription>

      const subscription = await subscribe

      if (subscription) {
        closure.subscription = subscription
      }

      return subscription
    }
    if (typeof done !== 'function') {
      return asyncConnect()
    }

    asyncConnect()
      .then(result => done(null, result))
      .catch(error => done(error, null))

    return undefined
  }, [])

  const dispose = useCallback((done?: (error?: Error) => void): PromiseOrVoid<
    void
  > => {
    const asyncDispose = async (): Promise<void> => {
      if (closure.subscription) {
        await client.unsubscribe(closure.subscription)
      }
    }

    if (typeof done !== 'function') {
      return asyncDispose()
    }

    asyncDispose()
      .then(() => done())
      .catch(error => done(error))

    return undefined
  }, [])

  if (
    !closure.initialStateSent &&
    typeof actualStateChangeCallback === 'function'
  ) {
    actualStateChangeCallback(closure.state, true)
    closure.initialStateSent = true
  }

  return useMemo(
    () => ({
      connect,
      dispose
    }),
    []
  )
}

export { useViewModel }
