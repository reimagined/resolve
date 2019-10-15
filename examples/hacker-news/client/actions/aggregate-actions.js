import { sendAggregateAction } from 'resolve-redux'

export const createStory = sendAggregateAction.bind(
  null,
  'Story',
  'createStory'
)
export const upvoteStory = sendAggregateAction.bind(
  null,
  'Story',
  'upvoteStory'
)
export const unvoteStory = sendAggregateAction.bind(
  null,
  'Story',
  'unvoteStory'
)

export const createUser = sendAggregateAction.bind(null, 'User', 'createUser')
export const confirmUser = sendAggregateAction.bind(null, 'User', 'confirmUser')
export const rejectUser = sendAggregateAction.bind(null, 'User', 'rejectUser')
