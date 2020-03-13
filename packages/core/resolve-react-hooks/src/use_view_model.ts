import { useContext, useCallback, useMemo } from 'react'
import { ResolveContext } from './context'
import { getClient, Subscription } from 'resolve-client'

type Closure = {
  state?: any
  subscription?: Subscription
}

type ViewModelConnection = {
  connect: (done?: Function) => void
  dispose: (done?: Function) => void
}

const useViewModel = (
  modelName: string,
  aggregateIds: string[] | '*',
  stateChangeCallback: (state: any) => void
): ViewModelConnection => {
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use reSolve hooks outside Resolve context')
  }

  const client = getClient(context)

  const { viewModels } = context
  const viewModel = viewModels.find(({ name }) => name === modelName)

  if (!viewModel) {
    throw Error(`View model ${modelName} not exist within context`)
  }

  // TODO: apply initial state from 'Init' view model handler
  const closure = useMemo<Closure>(() => ({}), [])

  const setState = useCallback(state => {
    closure.state = state
    stateChangeCallback(closure.state)
  }, [])

  const queryState = useCallback(async () => {
    const result = await client.query({
      name: modelName,
      aggregateIds,
      args: {}
    })
    if (result) {
      setState(result.data)
    }
  }, [])

  const applyEvent = useCallback(event => {
    setState(viewModel.projection[event.type](closure.state, event))
  }, [])

  const connect = useCallback(async done => {
    await queryState()
    const subscription = await client.subscribeTo(
      modelName,
      aggregateIds,
      event => applyEvent(event),
      done,
      () => queryState()
    )
    if (subscription) {
      closure.subscription = subscription
    }
  }, [])

  const dispose = useCallback(async done => {
    if (closure.subscription) {
      await client.unsubscribe(closure.subscription)
    }
    done()
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
