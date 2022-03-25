import { call, take, cancelled } from 'redux-saga/effects'

import { RootSagaArgs } from '../types'
import { ViewModelQuery } from '@resolve-js/client'
import { viewModelStateUpdate } from './actions'

type EventListenerSagaArgs = {
  viewModels: any
  sagaManager: any
  sagaKey: string
} & RootSagaArgs

type SubscriptionArgs = {
  query: ViewModelQuery
  cursor: string
  url: string
  state: any
  viewModel: any
}

const eventListenerSaga = function* (
  { client, store }: EventListenerSagaArgs,
  { cursor, url, query, state, viewModel }: SubscriptionArgs
): any {
  const { name, aggregateIds, args } = query

  const projection = viewModel.projection
  let viewModelState = state

  const subscription = yield call(
    [client, client.subscribe],
    url,
    cursor,
    name,
    aggregateIds,
    (event: any) => {
      viewModelState = projection[event.type](viewModelState, event, args)
      store.dispatch(viewModelStateUpdate(query, viewModelState, false))
    }
  )

  try {
    yield take(() => false)
  } finally {
    if (yield cancelled()) {
      yield call([client, client.unsubscribe], subscription)
    }
  }
}

export default eventListenerSaga
