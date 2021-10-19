const resolvers = {
  feedByAuthor: async (store, { authorId }) => {
    return store.find(
      'BlogPosts',
      {
        author: authorId,
      },
      {},
      { timestamp: -1 }
    )
  },
}
export default resolvers
