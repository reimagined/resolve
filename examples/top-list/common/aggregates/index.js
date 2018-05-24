export default [
  {
    name: 'Rating',
    commands: {
      append: (state, { payload: { id, name } }) => ({
        type: 'ItemAppended',
        payload: { id, name }
      }),
      upvote: (state, { payload: { id, userId } }) => ({
        type: 'RatingIncreased',
        payload: { id, userId }
      }),
      downvote: (state, { payload: { id, userId } }) => ({
        type: 'RatingDecreased',
        payload: { id, userId }
      })
    }
  }
];
