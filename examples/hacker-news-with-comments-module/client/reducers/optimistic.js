import Immutable from 'seamless-immutable'

import {
  REFRESH_ID_UPDATED,
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED,
  OPTIMISTIC_COMMENTS_LOADED,
  OPTIMISTIC_COMMENT_CREATED,
  OPTIMISTIC_COMMENT_UPDATED,
  OPTIMISTIC_COMMENT_REMOVED
} from '../actions/action-types'

export const initialState = Immutable({ votedStories: {}, comments: {} })

export default (state = initialState, action) => {
  switch (action.type) {
    case REFRESH_ID_UPDATED: {
      return state.set('refreshId', action.refreshId)
    }
    case OPTIMISTIC_STORY_UPVOTED: {
      return state.setIn(['votedStories', action.storyId], true)
    }
    case OPTIMISTIC_STORY_UNVOTED: {
      return state.setIn(['votedStories', action.storyId], false)
    }
    case OPTIMISTIC_COMMENTS_LOADED: {
      return state.setIn(['comments'], action.payload)
    }
    case OPTIMISTIC_COMMENT_CREATED: {
      return state.updateIn(['comments', 'children'], children => [
        ...children,
        action.payload
      ])
    }
    case OPTIMISTIC_COMMENT_UPDATED: {
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
    case OPTIMISTIC_COMMENT_REMOVED: {
      return state.updateIn(['comments', 'children'], children =>
        children.filter(child => child.commentId !== action.payload.commentId)
      )
    }
    default:
      return state
  }
}
