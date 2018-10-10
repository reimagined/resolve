import uuid from 'uuid/v4'

import {
  REFRESH_ID_UPDATED,
  USER_LOGOUT,
  OPTIMISTIC_STORY_UNVOTED,
  OPTIMISTIC_STORY_UPVOTED
} from '../action-types'

export const updateRefreshId = () => ({
  type: REFRESH_ID_UPDATED,
  refreshId: uuid()
})

export const logout = () => ({
  type: USER_LOGOUT
})

export const optimisticUpvoteStory = storyId => ({
  type: OPTIMISTIC_STORY_UPVOTED,
  storyId
})

export const optimisticUnvoteStory = storyId => ({
  type: OPTIMISTIC_STORY_UNVOTED,
  storyId
})
