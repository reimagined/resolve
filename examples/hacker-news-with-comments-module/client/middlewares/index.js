// TODO remove

import storyCreateMiddleware from './story-create-middleware'
import optimisticVotingMiddleware from './optimistic-voting-middleware'
import optimisticCommentsMiddleware from './optimistic-comments-middleware'

export default [
  storyCreateMiddleware,
  optimisticVotingMiddleware,
  optimisticCommentsMiddleware
]
