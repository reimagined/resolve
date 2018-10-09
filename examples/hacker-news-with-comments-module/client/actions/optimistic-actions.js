import uuid from 'uuid/v4'

import {
  REFRESH_ID_UPDATED,
  USER_LOGOUT,
  OPTIMISTIC_COMMENT_CREATED,
  OPTIMISTIC_COMMENT_UPDATED,
  OPTIMISTIC_COMMENT_REMOVED,
  OPTIMISTIC_COMMENTS_CREATED,
  OPTIMISTIC_STORY_UNVOTED,
  OPTIMISTIC_STORY_UPVOTED
} from './action-types'

export const updateRefreshId = () => ({
  type: REFRESH_ID_UPDATED,
  refreshId: uuid()
})

export const logout = () => ({
  type: USER_LOGOUT
})

export const optimisticCreateComments = (treeId, parentCommentId, payload) => ({
  type: OPTIMISTIC_COMMENTS_CREATED,
  treeId,
  parentCommentId,
  payload
})

export const optimisticCreateComment = (treeId, parentCommentId, payload) => ({
  type: OPTIMISTIC_COMMENT_CREATED,
  treeId,
  parentCommentId,
  payload
})

export const optimisticUpdateComment = (treeId, parentCommentId, payload) => ({
  type: OPTIMISTIC_COMMENT_UPDATED,
  treeId,
  parentCommentId,
  payload
})

export const optimisticRemoveComment = (treeId, parentCommentId, payload) => ({
  type: OPTIMISTIC_COMMENT_REMOVED,
  treeId,
  parentCommentId,
  payload
})

export const optimisticUpvoteStory = storyId => ({
  type: OPTIMISTIC_STORY_UPVOTED,
  storyId
})

export const optimisticUnvoteStory = storyId => ({
  type: OPTIMISTIC_STORY_UNVOTED,
  storyId
})
