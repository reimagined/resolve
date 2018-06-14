import { put } from 'redux-saga/effects'
import fetch from 'isomorphic-fetch'

import { loadViewModelStateSuccess, loadViewModelStateFailure } from './actions'

const loadViewModelStateSaga = function*(
  { viewModelName, aggregateIds, aggregateArgs },
  { rootPath }
) {
  try {
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
