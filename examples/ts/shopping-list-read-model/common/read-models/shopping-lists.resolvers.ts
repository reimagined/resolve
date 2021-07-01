import { ReadModelResolvers } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'

const resolvers: ReadModelResolvers<ResolveStore> = {
  all: async (store, args, { permitChannel }) => {
    permitChannel('all-lists', 'all-lists')
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  },
  list: async (store, { id }: { id: string }, { permitChannel }) => {
    permitChannel(`list-${id}`, `list-${id}`)
    return await store.findOne('ShoppingLists', { id })
  },
}

export default resolvers
