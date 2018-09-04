import { put } from 'redux-saga/effects'

import { loadReadModelStateSuccess, loadReadModelStateFailure } from './actions'

const loadReadModelStateSaga = function*(
  { api },
  { readModelName, resolverName, resolverArgs, queryId }
) {
  try {
    const { result } = yield api.loadReadModelState({
      readModelName,
      resolverName,
      resolverArgs,
      queryId
    })

    yield put(
      loadReadModelStateSuccess(
        readModelName,
        resolverName,
        resolverArgs,
        queryId,
        result
      )
    )
  } catch (error) {
    yield put(
      loadReadModelStateFailure(
        readModelName,
        resolverName,
        resolverArgs,
        queryId,
        error
      )
    )
  }
}

export default loadReadModelStateSaga
