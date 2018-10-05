import Immutable from 'seamless-immutable'

import {
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED,
  OPTIMISTIC_COMMENTS_INIT,
  OPTIMISTIC_COMMENT_CREATE,
  OPTIMISTIC_COMMENT_UPDATE,
  OPTIMISTIC_COMMENT_REMOVE
} from '../actions/action_types'

export const initialState = Immutable({ votedStories: {}, comments: {} })

export default (state = initialState, action) => {
  switch (action.type) {
    case OPTIMISTIC_STORY_UPVOTED: {
      return state.setIn(['votedStories', action.storyId], true)
    }
    case OPTIMISTIC_STORY_UNVOTED: {
      return state.setIn(['votedStories', action.storyId], false)
    }
    case OPTIMISTIC_COMMENTS_INIT: {
      return state.setIn(['comments'], action.payload)
    }
    case OPTIMISTIC_COMMENT_CREATE: {
      return state.updateIn(['comments', 'children'], children => [
        ...children,
        action.payload
      ])
    }
    case OPTIMISTIC_COMMENT_UPDATE: {
      return state.updateIn(['comments', 'children'], children =>
        children.map(
          child =>
            child.commentId === action.payload.commentId
              ? {
                  ...child,
                  ...action.payload
                }
              : child
        )
      )
    }
    case OPTIMISTIC_COMMENT_REMOVE: {
      return state.updateIn(['comments', 'children'], children =>
        children.filter(child => child.commentId !== action.payload.commentId)
      )
    }
    default:
      return state
  }
}
