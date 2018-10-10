import Immutable from 'seamless-immutable'

import {
  REFRESH_ID_UPDATED,
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED
} from '../action-types'

export const initialState = Immutable({ votedStories: {} })

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
    default:
      return state
  }
}
