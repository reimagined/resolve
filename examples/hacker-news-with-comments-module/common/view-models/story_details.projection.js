import { eventTypes as moduleCommentsEventTypes } from 'resolve-module-comments'

import { STORY_CREATED, STORY_UNVOTED, STORY_UPVOTED } from '../event_types'

const {
  COMMENT_CREATED,
  COMMENT_UPDATED,
  COMMENT_REMOVED
} = moduleCommentsEventTypes

export default {
  Init: () => ({}),
  [STORY_CREATED]: (
    state,
    { aggregateId, timestamp, payload: { title, link, userId, userName, text } }
  ) => {
    const type = !link ? 'ask' : /^(Show HN)/.test(title) ? 'show' : 'story'

    return {
      id: aggregateId,
      type,
      title,
      text,
      link,
      commentCount: 0,
      lastCommentSerial: '',
      votes: [],
      createdAt: timestamp,
      createdBy: userId,
      createdByName: userName
    }
  },

  [STORY_UPVOTED]: (state, { payload: { userId } }) => {
    const nextVotes = Array.from(new Set(state.votes).add(userId))
    return {
      ...state,
      votes: nextVotes
    }
  },

  [STORY_UNVOTED]: (state, { payload: { userId } }) => {
    const nextVotes = Array.from(new Set(state.votes).delete(userId))
    return {
      ...state,
      votes: nextVotes
    }
  },

  [COMMENT_CREATED]: (state, { timestamp, payload: { commentId } }) => {
    return {
      ...state,
      commentCount: state.commentCount + 1,
      lastCommentSerial: `${timestamp}-${commentId}`
    }
  },

  [COMMENT_UPDATED]: (state, { timestamp, payload: { commentId } }) => {
    return {
      ...state,
      lastCommentSerial: `${timestamp}-${commentId}`
    }
  },

  [COMMENT_REMOVED]: (state, { timestamp, payload: { commentId } }) => {
    return {
      ...state,
      commentCount: state.commentCount - 1,
      lastCommentSerial: `${timestamp}-${commentId}`
    }
  }
}
