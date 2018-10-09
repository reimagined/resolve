// TODO move to "resolve-module-comments"

import { createOptimisticMiddleware } from 'resolve-module-comments'

const optimisticCommentsMiddleware = createOptimisticMiddleware({
  aggregateName: 'HackerNewsComments',
  readModelName: 'HackerNewsComments'
})

export default optimisticCommentsMiddleware
