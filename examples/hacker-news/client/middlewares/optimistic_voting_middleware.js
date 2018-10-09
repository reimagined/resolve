import { actionTypes } from 'resolve-redux'

import {
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED
} from '../actions/action_types'

const { SEND_COMMAND_SUCCESS } = actionTypes

const optimisticVotingMiddleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'upvoteStory'
  ) {
    store.dispatch({
      type: OPTIMISTIC_STORY_UPVOTED,
      storyId: action.aggregateId
    })
  }
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'unvoteStory'
  ) {
    store.dispatch({
      type: OPTIMISTIC_STORY_UNVOTED,
      storyId: action.aggregateId
    })
  }

  next(action)
}

export default optimisticVotingMiddleware
