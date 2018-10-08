import { actionTypes } from 'resolve-redux'
import { routerActions } from 'react-router-redux'
import { commandTypes } from 'resolve-module-comments'

import {
  optimisticUpvoteStory,
  optimisticUnvoteStory,
  optimisticLoadComments,
  optimisticCreateComment,
  optimisticUpdateComment,
  optimisticRemoveComment
} from '../actions/optimistic-actions'

const { createComment, updateComment, removeComment } = commandTypes

const {
  SEND_COMMAND_SUCCESS,
  SEND_COMMAND_FAILURE,
  LOAD_READMODEL_STATE_SUCCESS
} = actionTypes

const storyCreateMiddleware = store => next => action => {
  next(action)

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'createStory'
  ) {
    setTimeout(() => {
      store.dispatch(routerActions.push(`/storyDetails/${action.aggregateId}`))
    }, 100)
  }
  if (
    action.type === SEND_COMMAND_FAILURE &&
    action.commandType === 'createStory'
  ) {
    setTimeout(() => {
      store.dispatch(routerActions.push(`/error?text=Failed to create a story`))
    }, 100)
  }
}

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

const optimisticCommentsMiddleware = store => next => action => {
  next(action)

  if (
    action.type === LOAD_READMODEL_STATE_SUCCESS &&
    action.readModelName === 'HackerNewsComments' &&
    action.resolverName === 'ReadCommentsTree'
  ) {
    store.dispatch(
      optimisticLoadComments(
        action.resolverArgs.treeId,
        action.resolverArgs.parentCommentId,
        action.result
      )
    )
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === createComment
  ) {
    store.dispatch(
      optimisticCreateComment(
        action.aggregateId,
        action.payload.parentCommentId,
        action.payload
      )
    )
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === updateComment
  ) {
    store.dispatch(
      optimisticUpdateComment(
        action.aggregateId,
        action.payload.parentCommentId,
        action.payload
      )
    )
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === removeComment
  ) {
    store.dispatch(
      optimisticRemoveComment(
        action.aggregateId,
        action.payload.parentCommentId,
        action.payload
      )
    )
  }
}

export default [
  storyCreateMiddleware,
  optimisticVotingMiddleware,
  optimisticCommentsMiddleware
]
