import { call, take } from 'redux-saga/effects'

import { RootSagaArgs } from '../types'
import { ViewModelQuery } from 'resolve-client'
import { DisconnectViewModelAction, viewModelStateUpdate } from './actions'
import { DISCONNECT_VIEWMODEL } from '../action-types'

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

const eventListenerSaga = function*(
  { viewModels, sagaKey, sagaManager, client, store }: EventListenerSagaArgs,
  { cursor, url, query, state, viewModel }: SubscriptionArgs
) {
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

  while (true) {
    const action: DisconnectViewModelAction = yield take(DISCONNECT_VIEWMODEL)
    if (action.query === query) {
      yield call([client, client.unsubscribe], subscription)
      break
    }
  }
}

export default eventListenerSaga
