import { takeEvery, put } from 'redux-saga/effects'
import {
  optimisticUnvoteStory,
  optimisticUpvoteStory
} from '../actions/optimistic-actions'
import { actionTypes } from 'resolve-redux'

const { SEND_COMMAND_SUCCESS } = actionTypes

export default function*() {
  yield takeEvery(
    action =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'upvoteStory',
    function*(action) {
      yield put(optimisticUpvoteStory(action.aggregateId))
    }
  )

  yield takeEvery(
    action =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'unvoteStory',
    function*(action) {
      yield put(optimisticUnvoteStory(action.aggregateId))
    }
  )
}
