import { useContext, useCallback, useMemo } from 'react'
import { ResolveContext } from './context'
import {
  getClient,
  QueryOptions,
  SubscribeCallback,
  Subscription
} from 'resolve-client'

type Closure = {
  state?: any
  subscription?: Subscription
}

type ViewModelConnection = {
  connect: (done?: SubscribeCallback) => Promise<Subscription | undefined>
  dispose: (done?: Function) => void
}

type StateChangedCallback = (state: any) => void

const useViewModel = (
  modelName: string,
  aggregateIds: string[] | '*',
  stateChangeCallback: StateChangedCallback,
  queryOptions?: QueryOptions
): ViewModelConnection => {
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use reSolve hooks outside Resolve context')
  }

  const client = useMemo(() => getClient(context), [context])

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

  const connect = useCallback(async (done?: SubscribeCallback): Promise<
    Subscription | undefined
  > => {
    let complete: SubscribeCallback = () => {
      /* no op */
    }
    let promise: Promise<Subscription | undefined> = Promise.resolve(undefined)

    if (typeof done === 'function') {
      complete = done
    } else {
      promise = new Promise((resolve, reject) => {
        complete = (
          error: Error | null,
          subscription: Subscription | null
        ): any => {
          if (error) {
            return reject(error)
          }
          if (!subscription) {
            return reject(Error(`no subscription returned`))
          }
          return resolve(subscription)
        }
      })
    }

    try {
      await queryState()
      const subscription = await client.subscribeTo(
        modelName,
        aggregateIds,
        event => applyEvent(event),
        complete,
        () => queryState()
      )
      if (subscription) {
        closure.subscription = subscription
      }
    } catch (err) {
      complete(err, null)
    }
    return promise
  }, [])

  const dispose = useCallback(async done => {
    // TODO: return promise if no done callback provided
    if (closure.subscription) {
      await client.unsubscribe(closure.subscription)
    }
    if (done) {
      done()
    }
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
