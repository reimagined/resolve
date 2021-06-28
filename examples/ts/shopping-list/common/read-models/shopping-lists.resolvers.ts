import { ReadModelResolvers } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'

const resolvers: ReadModelResolvers<ResolveStore> = {
  all: async (store) => {
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  },
}

export default resolvers
