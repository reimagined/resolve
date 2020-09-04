import { call, put } from 'redux-saga/effects'
import { ConnectViewModelAction, viewModelStateUpdate } from './actions'
import {
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
} from '../internal/action-types'
import { RootSagaArgs } from '../types'
import eventListenerSaga from './event-listener-saga'

type ConnectViewSagaArgs = {
  viewModels: any
  sagaManager: any
  sagaKey: string
} & RootSagaArgs

const connectViewModelSaga = function* (
  sagaArgs: ConnectViewSagaArgs,
  action: ConnectViewModelAction
) {
  const { sagaManager, sagaKey, client, viewModels } = sagaArgs
  const { query } = action

  yield* sagaManager.stop(`${DISCONNECT_VIEWMODEL}${sagaKey}`)

  const viewModel = viewModels.find((model: any) => model.name === query.name)

  let state =
    typeof viewModel.projection.Init === 'function'
      ? viewModel.projection.Init
      : null

  yield put(viewModelStateUpdate(query, state, true))

  const {
    data,
    meta: { url, cursor },
  } = yield call([client, client.query], query)

  yield put(viewModelStateUpdate(query, data, false))

  state = data

  yield* sagaManager.start(
    `${CONNECT_VIEWMODEL}${sagaKey}`,
    eventListenerSaga,
    sagaArgs,
    {
      url,
      cursor,
      query,
      viewModel,
      state,
    }
  )
}

export default connectViewModelSaga
