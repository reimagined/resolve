import { put } from 'redux-saga/effects'

import { loadViewModelStateSuccess, loadViewModelStateFailure } from './actions'

const loadViewModelStateSaga = function*(
  { api, viewModels },
  { viewModelName, aggregateIds, aggregateArgs }
) {
  console.log({ viewModelName, aggregateIds, aggregateArgs })
  console.log({ api, viewModels })
  try {
    // TODO use api
    const {
      serializedState,
      aggregateVersionsMap
    } = yield api.loadViewModelState({
      viewModelName,
      aggregateIds,
      aggregateArgs
    })
    console.log('TAKE')

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
        aggregateVersionsMap
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
