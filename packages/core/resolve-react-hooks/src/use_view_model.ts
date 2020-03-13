import { useState, useContext, useCallback } from 'react'
import { ResolveContext } from './context'
import { getClient, Subscription } from 'resolve-client'

type Closure = {
  applyEvent: Function
  resubscribe: Function
  subscription?: Subscription
}

type ViewModelConnection = {
  state: any
  connect: (done: Function) => void
  dispose: (done: Function) => void
}

const useViewModel = (
  modelName: string,
  aggregateIds: string[] | '*'
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

  const [state, setState] = useState({})

  const queryState = useCallback(
    () =>
      client.query({
        name: modelName,
        aggregateIds,
        args: {}
      }),
    []
  )

  const closure: Closure = {
    applyEvent: useCallback(
      event => {
        setState(viewModel.projection[event.type](state, event))
      },
      [state, setState]
    ),
    resubscribe: queryState
  }

  const connect = useCallback(async done => {
    await queryState()
    const subscription = await client.subscribeTo(
      modelName,
      aggregateIds,
      event => closure.applyEvent(event),
      done,
      () => closure.resubscribe()
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

  return {
    state,
    connect,
    dispose
  }
}

export { useViewModel }
