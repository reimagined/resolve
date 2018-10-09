import {
  optimisticUnvoteStory,
  optimisticUpvoteStory
} from '../actions/optimistic-actions'
import { actionTypes } from 'resolve-redux'

const { SEND_COMMAND_SUCCESS } = actionTypes

const optimisticVotingMiddleware = store => next => action => {
  next(action)

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'upvoteStory'
  ) {
    store.dispatch(optimisticUpvoteStory(action.aggregateId))
  }
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'unvoteStory'
  ) {
    store.dispatch(optimisticUnvoteStory(action.aggregateId))
  }
}

export default optimisticVotingMiddleware
