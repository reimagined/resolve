import { createActions } from 'resolve-redux'

const createAggregateActions = commentsOptions => {
  const aggregates = [
    {
      name: 'Story',
      commands: { createStory() {}, upvoteStory() {}, unvoteStory() {} }
    },
    {
      name: 'User',
      commands: { createUser() {}, confirmUser() {}, rejectUser() {} }
    },
    {
      name: commentsOptions.aggregateName,
      commands: {
        [commentsOptions.createComment]() {},
        [commentsOptions.updateComment]() {},
        [commentsOptions.removeComment]() {}
      }
    }
  ]

  const aggregateActions = aggregates.reduce(
    (acc, aggregate) => Object.assign(acc, createActions(aggregate)),
    {}
  )

  return aggregateActions
}

export default createAggregateActions
