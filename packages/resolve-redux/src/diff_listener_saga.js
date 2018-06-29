import { take, put, select, fork } from 'redux-saga/effects'
import { delay } from 'redux-saga'

import { diffMessageType, diffVersionsMap } from './constants'
import { CONNECT_READMODEL, DISPATCH_MQTT_MESSAGE } from './action_types'
import { applyReadModelDiff } from './actions'

const diffListenerSaga = function*(
  { sagaKey, sagaManager, queryId },
  connectAction
) {
  let diffQueue = []

  while (true) {
    const { message } = yield take(
      action =>
        action.type === DISPATCH_MQTT_MESSAGE &&
        action.message.type === diffMessageType &&
        action.message.queryId === queryId
    )
    diffQueue.push(message)

    const {
      readModels: { [diffVersionsMap]: readModelsDiffVersionsMap }
    } = yield select()

    if (!readModelsDiffVersionsMap.hasOwnProperty(queryId)) {
      continue
    }

    let lastDiffVersionByQueryId = readModelsDiffVersionsMap[queryId]

    diffQueue = diffQueue.filter(
      savedDiff => !(savedDiff.diffVersion <= lastDiffVersionByQueryId)
    )

    const nextDiffs = diffQueue.sort((a, b) => a.diffVersion - b.diffVersion)

    while (
      nextDiffs.length > 0 &&
      nextDiffs[0].diffVersion === lastDiffVersionByQueryId + 1
    ) {
      yield put(
        applyReadModelDiff(
          connectAction.readModelName,
          connectAction.resolverName,
          connectAction.resolverArgs,
          nextDiffs[0].diff
        )
      )

      nextDiffs.splice(0, 1)
      lastDiffVersionByQueryId++
    }

    readModelsDiffVersionsMap[queryId] = lastDiffVersionByQueryId

    if (nextDiffs.length > 10) {
      //TODO maybe fork fork die
      yield fork(function*() {
        yield delay(100)
        yield put(connectAction)
      })
      yield* sagaManager.stop(`${CONNECT_READMODEL}${sagaKey}`)
    }
  }
}

export default diffListenerSaga
