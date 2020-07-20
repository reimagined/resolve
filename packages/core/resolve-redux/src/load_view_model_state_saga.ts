import { put } from 'redux-saga/effects'

import { API } from './create_api'
import { loadViewModelStateSuccess, loadViewModelStateFailure } from './actions'

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
      loadViewModelStateSuccess(
        viewModelName,
        aggregateIds,
        aggregateArgs,
        state,
        timestamp
      )
    )
  } catch (error) {
    yield put(
      loadViewModelStateFailure(
        viewModelName,
        aggregateIds,
        aggregateArgs,
        error
      )
    )
  }
}

export default loadViewModelStateSaga
