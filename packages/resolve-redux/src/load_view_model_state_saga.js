import { put } from 'redux-saga/effects'

import { loadViewModelStateSuccess, loadViewModelStateFailure } from './actions'

const loadViewModelStateSaga = function*(
  { viewModelName, aggregateIds, aggregateArgs },
  { api }
) {
  try {
    // TODO use api
    const request = yield fetch(
      `/${rootPath}/api/query/${viewModelName}?aggregateIds=${JSON.stringify(
        aggregateIds
      )}`
    )
    if (!request.ok) {
      const error = yield request.text()
      throw new Error(error)
    }
    const state = yield request.json()
    yield put(
      loadViewModelStateSuccess(
        viewModelName,
        aggregateIds,
        aggregateArgs,
        state
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
