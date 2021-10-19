import {
  USER_LOGOUT,
  OPTIMISTIC_STORY_UNVOTED,
  OPTIMISTIC_STORY_UPVOTED,
} from '../action-types'
export const logout = () => ({
  type: USER_LOGOUT,
})
export const optimisticUpvoteStory = (storyId) => ({
  type: OPTIMISTIC_STORY_UPVOTED,
  storyId,
})
export const optimisticUnvoteStory = (storyId) => ({
  type: OPTIMISTIC_STORY_UNVOTED,
  storyId,
})
