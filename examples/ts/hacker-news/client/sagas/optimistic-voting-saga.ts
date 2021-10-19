import { takeEvery, put } from 'redux-saga/effects'
import {
  optimisticUnvoteStory,
  optimisticUpvoteStory,
} from '../actions/optimistic-actions'
import { internal } from '@resolve-js/redux'
import { CommandAction } from '../types'

const { SEND_COMMAND_SUCCESS } = internal.actionTypes

export function* optimisticVotingSaga() {
  yield takeEvery(
    (action: CommandAction) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'upvoteStory',
    function* (action) {
      yield put(optimisticUpvoteStory((action as any).command.aggregateId))
    }
  )

  yield takeEvery(
    (action: CommandAction) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'unvoteStory',
    function* (action) {
      yield put(optimisticUnvoteStory((action as any).command.aggregateId))
    }
  )
}
