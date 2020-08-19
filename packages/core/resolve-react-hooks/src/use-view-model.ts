import { useContext, useCallback, useMemo } from 'react'
import { ResolveContext } from './context'
import { QueryOptions, SubscribeCallback, Subscription } from 'resolve-client'
import { useClient } from './use-client'

type StateChangedCallback = (state: any) => void
type PromiseOrVoid<T> = Promise<T> | void

type Closure = {
  state?: any
  subscription?: Subscription
  url?: string
  cursor?: string
}

type ViewModelConnection = {
  connect: (done?: SubscribeCallback) => PromiseOrVoid<Subscription>
  dispose: (done?: (error?: Error) => void) => PromiseOrVoid<void>
}

const useViewModel = (
  modelName: string,
  aggregateIds: string[] | '*',
  stateChangeCallback: StateChangedCallback,
  queryOptions?: QueryOptions
): ViewModelConnection => {
  const log = console
  const context = useContext(ResolveContext)
  const client = useClient()

  log.debug(`searching for view model metadata`)

  const { viewModels } = context
  const viewModel = viewModels.find(({ name }) => name === modelName)

  if (!viewModel) {
    const error = Error(`View model ${modelName} not exist within context`)
    log.error(error.message)
    throw error
  }

  log.debug(`view model metadata found`)

  const closure = useMemo<Closure>(
    () => ({
      state: viewModel.projection.Init ? viewModel.projection.Init() : null
    }),
    []
  )

  const setState = useCallback(state => {
    closure.state = state
    stateChangeCallback(closure.state)
  }, [])

  const queryState = useCallback(async () => {
    log.debug(`querying view model state`)
    const result = await client.query(
      {
        name: modelName,
        aggregateIds,
        args: {}
      },
      queryOptions
    )
    log.debug(`view model state arrived`)
    if (result) {
      const { data, meta: { url, cursor } = {} } = result
      log.debug(data)
      setState(data)
      closure.url = url
      closure.cursor = cursor
    } else {
      log.debug(`query have not result`)
    }
  }, [])

  const applyEvent = useCallback(event => {
    log.debug(`applying event [${event.type}]`)
    setState(viewModel.projection[event.type](closure.state, event))
  }, [])

  const connect = useCallback((done?: SubscribeCallback): PromiseOrVoid<
    Subscription
  > => {
    const asyncConnect = async (): Promise<Subscription> => {
      log.debug(`connecting view model`)

      await queryState()

      log.debug(`subscribing to incoming events`)

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

      log.debug(`subscribed successfully`)

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

  return useMemo(
    () => ({
      connect,
      dispose
    }),
    []
  )
}

export { useViewModel }
