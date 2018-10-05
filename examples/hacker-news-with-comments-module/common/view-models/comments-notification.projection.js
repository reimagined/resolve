import { eventTypes as moduleCommentsEventTypes } from 'resolve-module-comments'

const {
  COMMENT_CREATED,
  COMMENT_UPDATED,
  COMMENT_REMOVED
} = moduleCommentsEventTypes

export default {
  Init: () => ({}),

  [COMMENT_CREATED]: (
    state,
    {
      timestamp,
      payload: {
        commentId,
        content: { userId }
      }
    }
  ) => {
    return {
      timestamp,
      commentId,
      userId
    }
  },

  [COMMENT_UPDATED]: (
    state,
    {
      timestamp,
      payload: {
        commentId,
        content: { userId }
      }
    }
  ) => {
    return {
      timestamp,
      commentId,
      userId
    }
  },

  [COMMENT_REMOVED]: (
    state,
    {
      timestamp,
      payload: {
        commentId,
        content: { userId }
      }
    }
  ) => {
    return {
      timestamp,
      commentId,
      userId
    }
  }
}
