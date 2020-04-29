import { ReadModelResolvers } from 'resolve-core'
import { ResolveStore } from 'resolve-readmodel-base'

const resolvers: ReadModelResolvers<ResolveStore> = {
  feedByAuthor: async (store, { authorId }) => {
    return store.find(
      'BlogPosts',
      {
        author: authorId as string
      },
      {},
      { timestamp: -1 }
    )
  }
}

export default resolvers
