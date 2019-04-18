const treeId = 'tree-id'

const resolvers = {
  getComments: async store => {
    const { comments: commentsMap } = await store.findOne('CommentsAsMap', {
      treeId
    })

    const {
      comments: commentsList,
      commentsCount: commentsListLength
    } = await store.findOne('CommentsAsList', {
      treeId
    })

    return {
      commentsMap,
      commentsListLength,
      commentsList
    }
  }
}

export default resolvers
