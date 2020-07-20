import { put } from 'redux-saga/effects'
import { API } from './create_api'

import { loadReadModelStateSuccess, loadReadModelStateFailure } from './actions'

const loadReadModelStateSaga = function*(
  { api }: { api: API },
  {
    readModelName,
    resolverName,
    resolverArgs,
    queryId
  }: {
    type: string
    readModelName: string
    resolverName: string
    resolverArgs: any
    queryId: any
  }
) {
  try {
    const { result: serializedData, timestamp } = yield api.loadReadModelState({
      readModelName,
      resolverName,
      resolverArgs
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
