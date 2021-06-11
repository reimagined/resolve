import { ReadModelResolvers } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'

const resolvers: ReadModelResolvers<ResolveStore> = {
  feedByAuthor: async (store, { authorId }: { authorId: string }) => {
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
