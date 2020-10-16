import { takeEvery, put } from 'redux-saga/effects'
import {
  optimisticUnvoteStory,
  optimisticUpvoteStory,
} from '../actions/optimistic-actions'
import { internal } from 'resolve-redux'

const { SEND_COMMAND_SUCCESS } = internal.actionTypes

export default function* () {
  yield takeEvery(
    (action) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'upvoteStory',
    function* (action) {
      yield put(optimisticUpvoteStory(action.command.aggregateId))
    }
  )

  yield takeEvery(
    (action) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'unvoteStory',
    function* (action) {
      yield put(optimisticUnvoteStory(action.command.aggregateId))
    }
  )
}
