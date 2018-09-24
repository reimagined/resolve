import {
  STORY_COMMENTED,
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED
} from '../event_types'

export default {
  Init: () => ({}),
  [STORY_CREATED]: (state, { timestamp, payload: { userId } }) => ({
    ...state,
    createdAt: timestamp,
    createdBy: userId,
    voted: [],
    comments: {}
  }),

  [STORY_UPVOTED]: (state, { payload: { userId } }) => ({
    ...state,
    voted: state.voted.concat(userId)
  }),

  [STORY_UNVOTED]: (state, { payload: { userId } }) => ({
    ...state,
    voted: state.voted.filter(curUserId => curUserId !== userId)
  }),

  [STORY_COMMENTED]: (
    state,
    { timestamp, payload: { commentId, userId } }
  ) => ({
    ...state,
    comments: {
      ...state.comments,
      [commentId]: {
        createdAt: timestamp,
        createdBy: userId
      }
    }
  })
}
