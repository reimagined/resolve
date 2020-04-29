import { ReadModelResolvers } from 'resolve-core'
import { ResolveStore } from 'resolve-readmodel-base'
import { decode } from '../jwt'
import { systemUserId } from '../constants'

const resolvers: ReadModelResolvers<ResolveStore> = {
  byOwner: async (store, { ownerId }, jwt) => {
    const { userId } = decode(jwt)
    if (userId !== systemUserId) {
      throw Error('you are not authorized to perform this operation')
    }
    return store.find('Media', { owner: ownerId as string })
  }
}

export default resolvers
