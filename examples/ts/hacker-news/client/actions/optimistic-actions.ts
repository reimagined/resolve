import {
  USER_LOGOUT,
  OPTIMISTIC_STORY_UNVOTED,
  OPTIMISTIC_STORY_UPVOTED,
} from '../action-types'

export const logout = () => ({
  type: USER_LOGOUT,
})

export const optimisticUpvoteStory = (storyId: string) => ({
  type: OPTIMISTIC_STORY_UPVOTED,
  storyId,
})

export const optimisticUnvoteStory = (storyId: string) => ({
  type: OPTIMISTIC_STORY_UNVOTED,
  storyId,
})
