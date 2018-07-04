import { actionTypes } from 'resolve-redux'

import {
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED
} from '../actions/actionTypes'
import { rootDirectory } from '../constants'

const { SEND_COMMAND_SUCCESS, SEND_COMMAND_FAILURE } = actionTypes

const storyCreateMiddleware = () => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'createStory'
  ) {
    window.location = `${rootDirectory}/storyDetails/${action.aggregateId}`
  }
  if (
    action.type === SEND_COMMAND_FAILURE &&
    action.commandType === 'createStory'
  ) {
    window.location = `${rootDirectory}/error?text=Failed to create a story`
  }
  next(action)
}

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

export default [storyCreateMiddleware, optimisticVotingMiddleware]
