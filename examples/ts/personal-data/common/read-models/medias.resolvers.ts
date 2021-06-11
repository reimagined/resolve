import { ReadModelResolvers } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'
import { decode } from '../jwt'
import { systemUserId } from '../constants'

const resolvers: ReadModelResolvers<ResolveStore> = {
  byOwner: async (store, { ownerId }: { ownerId: string }, { jwt }) => {
    const { userId } = decode(jwt)
    if (userId !== systemUserId) {
      throw Error('you are not authorized to perform this operation')
    }
    return store.find('Media', { owner: ownerId })
  },
}

export default resolvers
