import { put } from 'redux-saga/effects'

import { loadReadModelStateSuccess, loadReadModelStateFailure } from './actions'

const loadReadModelStateSaga = function*(
  { api },
  { readModelName, resolverName, resolverArgs, isReactive, queryId }
) {
  try {
    const state = yield api.loadReadModelState({
      readModelName,
      resolverName,
      resolverArgs,
      isReactive,
      queryId
    })

    yield put(
      loadReadModelStateSuccess(
        readModelName,
        resolverName,
        resolverArgs,
        isReactive,
        queryId,
        state
      )
    )
  } catch (error) {
    yield put(
      loadReadModelStateFailure(
        readModelName,
        resolverName,
        resolverArgs,
        isReactive,
        queryId,
        error
      )
    )
  }
}

export default loadReadModelStateSaga
