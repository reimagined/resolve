import { ReadModelResolvers } from 'resolve-core'
import { ResolveStore } from 'resolve-readmodel-base'

const resolvers: ReadModelResolvers<ResolveStore> = {
  feedByAuthor: async (store, params) => {
    return [
      { title: 'title1', content: 'content1' },
      { title: 'title2', content: 'content2' },
      { title: 'title3', content: 'content3' }
    ]
    // TODO: return store.find('BlogPosts', { author: params.authorId })
  }
}

export default resolvers
