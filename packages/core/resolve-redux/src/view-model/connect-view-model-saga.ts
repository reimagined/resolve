import { call, put } from 'redux-saga/effects'
import { ConnectViewModelAction, viewModelStateUpdate } from './actions'
import { CONNECT_VIEWMODEL, DISCONNECT_VIEWMODEL } from '../action-types'
import { RootSagaArgs } from '../types'
import eventListenerSaga from './event-listener-saga'

type ConnectViewSagaArgs = {
  viewModels: any
  sagaManager: any
  sagaKey: string
} & RootSagaArgs

const connectViewModelSaga = function*(
  sagaArgs: ConnectViewSagaArgs,
  action: ConnectViewModelAction
) {
  const { sagaManager, sagaKey, client } = sagaArgs
  const { query } = action

  yield* sagaManager.stop(`${DISCONNECT_VIEWMODEL}${sagaKey}`)

  const { data, url, cursor } = yield call([client, client.query], query)

  yield put(viewModelStateUpdate(query, data, false))

  yield* sagaManager.start(
    `${CONNECT_VIEWMODEL}${sagaKey}`,
    eventListenerSaga,
    sagaArgs,
    {
      url,
      cursor
    }
  )
}

export default connectViewModelSaga
