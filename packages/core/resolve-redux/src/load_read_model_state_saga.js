import { put } from 'redux-saga/effects'

import { loadReadModelStateSuccess, loadReadModelStateFailure } from './actions'

const loadReadModelStateSaga = function*(
  { api },
  { readModelName, resolverName, resolverArgs, queryId }
) {
  try {
    const { result: serializedData, timestamp } = yield api.loadReadModelState({
      readModelName,
      resolverName,
      resolverArgs,
      queryId
    })

    const data = JSON.parse(serializedData)

    yield put(
      loadReadModelStateSuccess(
        readModelName,
        resolverName,
        resolverArgs,
        queryId,
        data,
        timestamp
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
