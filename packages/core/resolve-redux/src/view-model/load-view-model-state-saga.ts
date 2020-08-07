import { put } from 'redux-saga/effects'

import { API } from '../create_api'
import { queryViewModelSuccess, queryViewModelFailure } from './actions'

const loadViewModelStateSaga = function*(
  {
    api,
    viewModels
  }: {
    api: API
    viewModels: any[]
  },
  {
    viewModelName,
    aggregateIds,
    aggregateArgs
  }: {
    type: string
    viewModelName: string
    aggregateIds: string | string[]
    aggregateArgs: any
  }
): any {
  try {
    const { result: serializedState, timestamp } = yield api.loadViewModelState(
      {
        viewModelName,
        aggregateIds
      }
    )

    const { deserializeState } = viewModels.find(
      ({ name }) => name === viewModelName
    )

    const state = deserializeState(serializedState)

    yield put(
      queryViewModelSuccess(
        viewModelName,
        aggregateIds,
        aggregateArgs,
        state,
        timestamp
      )
    )
  } catch (error) {
    yield put(
      queryViewModelFailure(viewModelName, aggregateIds, aggregateArgs, error)
    )
  }
}

export default loadViewModelStateSaga
