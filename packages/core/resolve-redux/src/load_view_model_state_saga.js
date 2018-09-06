import { put } from 'redux-saga/effects'

import { loadViewModelStateSuccess, loadViewModelStateFailure } from './actions'

const loadViewModelStateSaga = function*(
  { api, viewModels },
  { viewModelName, aggregateIds, aggregateArgs }
) {
  try {
    const { result: serializedState, timestamp } = yield api.loadViewModelState(
      {
        viewModelName,
        aggregateIds,
        aggregateArgs
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
