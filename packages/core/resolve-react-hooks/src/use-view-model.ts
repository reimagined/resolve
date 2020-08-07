import { useContext, useCallback, useMemo } from 'react'
import { ResolveContext } from './context'
import { QueryOptions, SubscribeCallback, Subscription } from 'resolve-client'
import { useClient } from './use-client'

type StateChangedCallback = (state: any) => void
type PromiseOrVoid<T> = Promise<T> | void

type Closure = {
  state?: any
  subscription?: Subscription
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
  const context = useContext(ResolveContext)
  const client = useClient()

  const { viewModels } = context
  const viewModel = viewModels.find(({ name }) => name === modelName)

  if (!viewModel) {
    throw Error(`View model ${modelName} not exist within context`)
  }

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
    const result = await client.query(
      {
        name: modelName,
        aggregateIds,
        args: {}
      },
      queryOptions
    )
    if (result) {
      setState(result.data)
    }
  }, [])

  const applyEvent = useCallback(event => {
    setState(viewModel.projection[event.type](closure.state, event))
  }, [])

  const connect = useCallback((done?: SubscribeCallback): PromiseOrVoid<
    Subscription
  > => {
    const asyncConnect = async (): Promise<Subscription> => {
      await queryState()

      const subscribe = client.subscribe(
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

  return useMemo(
    () => ({
      connect,
      dispose
    }),
    []
  )
}

export { useViewModel }
