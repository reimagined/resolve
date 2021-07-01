import { ReadModelResolvers } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'
import { systemUserId } from '../constants'
import { AuthResolverMiddlewareContext } from '../../types'

const resolvers: ReadModelResolvers<
  ResolveStore,
  AuthResolverMiddlewareContext
> = {
  byOwner: async (store, { ownerId }: { ownerId: string }, { user }) => {
    const { userId } = user
    if (userId !== systemUserId) {
      throw Error('you are not authorized to perform this operation')
    }
    return store.find('Media', { owner: ownerId })
  },
}

export default resolvers
