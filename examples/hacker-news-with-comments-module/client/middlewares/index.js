import { actionTypes } from 'resolve-redux'
import { routerActions } from 'react-router-redux'
import { commandTypes } from 'resolve-module-comments'

import {
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED,
  OPTIMISTIC_COMMENTS_INIT,
  OPTIMISTIC_COMMENT_CREATE,
  OPTIMISTIC_COMMENT_UPDATE,
  OPTIMISTIC_COMMENT_REMOVE
} from '../actions/action_types'

const { createComment, updateComment, removeComment } = commandTypes

const {
  SEND_COMMAND_SUCCESS,
  SEND_COMMAND_FAILURE,
  LOAD_READMODEL_STATE_SUCCESS
} = actionTypes

const storyCreateMiddleware = store => next => action => {
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

const optimisticCommentsMiddleware = store => next => action => {
  if (
    action.type === LOAD_READMODEL_STATE_SUCCESS &&
    action.readModelName === 'HackerNewsComments' &&
    action.resolverName === 'ReadCommentsTree'
  ) {
    store.dispatch({
      type: OPTIMISTIC_COMMENTS_INIT,
      treeId: action.resolverArgs.treeId,
      parentCommentId: action.resolverArgs.parentCommentId,
      payload: action.result
    })
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === createComment
  ) {
    store.dispatch({
      type: OPTIMISTIC_COMMENT_CREATE,
      treeId: action.aggregateId,
      parentCommentId: action.payload.parentCommentId,
      payload: action.payload
    })
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === updateComment
  ) {
    store.dispatch({
      type: OPTIMISTIC_COMMENT_UPDATE,
      treeId: action.aggregateId,
      parentCommentId: action.payload.parentCommentId,
      payload: action.payload
    })
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === removeComment
  ) {
    store.dispatch({
      type: OPTIMISTIC_COMMENT_REMOVE,
      treeId: action.aggregateId,
      parentCommentId: action.payload.parentCommentId,
      payload: action.payload
    })
  }

  next(action)
}

export default [
  storyCreateMiddleware,
  optimisticVotingMiddleware,
  optimisticCommentsMiddleware
]
