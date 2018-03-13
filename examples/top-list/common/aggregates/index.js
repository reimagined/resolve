export default [
  {
    name: 'Rating',
    commands: {
      append: (_, { payload: { id, name } }) => ({
        type: 'ItemAppended',
        payload: { id, name }
      }),
      upvote: (_, { payload: { id, userId } }) => ({
        type: 'RatingIncreased',
        payload: { id }
      }),
      downvote: (_, { payload: { id, userId } }) => ({
        type: 'RatingDecreased',
        payload: { id, userId }
      })
    }
  }
]
