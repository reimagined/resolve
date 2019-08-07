import { put, takeEvery, delay } from 'redux-saga/effects'
import { routerActions } from 'react-router-redux'
import { actionTypes } from 'resolve-redux'

const { SEND_COMMAND_SUCCESS, SEND_COMMAND_FAILURE } = actionTypes

export default function*({ api }) {
  yield takeEvery(
    action =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'createStory',
    function*(action) {
      while (true) {
        try {
          const { result } = yield api.loadReadModelState({
            readModelName: 'HackerNews',
            resolverName: 'story',
            resolverArgs: { id: action.aggregateId }
          })

          if (JSON.parse(result) == null) {
            yield delay(300)
            continue
          }

          yield put(routerActions.push(`/storyDetails/${action.aggregateId}`))
          break
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(error)
          break
        }
      }
    }
  )

  yield takeEvery(
    action =>
      action.type === SEND_COMMAND_FAILURE &&
      action.commandType === 'createStory',
    function*() {
      yield put(routerActions.push(`/error?text=Failed to create a story`))
    }
  )
}
