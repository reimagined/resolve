import {
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED,
} from '../action-types'
import { Action } from 'redux'

export const initialState = { votedStories: {} }

type StoryAction = Action & { storyId: string }

export const optimisticReducer = (
  state = initialState,
  action: StoryAction
) => {
  switch (action.type) {
    case OPTIMISTIC_STORY_UPVOTED: {
      return {
        ...state,
        votedStories: {
          ...state.votedStories,
          [action.storyId]: true,
        },
      }
    }
    case OPTIMISTIC_STORY_UNVOTED: {
      return {
        ...state,
        votedStories: {
          ...state.votedStories,
          [action.storyId]: false,
        },
      }
    }
    default:
      return state
  }
}
