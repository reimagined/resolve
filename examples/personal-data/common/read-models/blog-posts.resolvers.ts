import { ReadModelResolvers } from 'resolve-core'
import { ResolveStore } from 'resolve-readmodel-base'

const resolvers: ReadModelResolvers<ResolveStore> = {
  feedByAuthor: async (
    store,
    params: {
      authorId: string
    }
  ) => {
    return store.find('BlogPosts', {
      author: params.authorId
    })
  },
  feed: async store => {
    return store.find('BlogPosts', {}, {}, { timestamp: -1 })
  }
}

export default resolvers
