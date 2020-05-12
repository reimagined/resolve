import { decode } from '../jwt'
import { systemUserId } from '../constants'

const resolvers = {
  byOwner: async (store, { ownerId }, jwt) => {
    const { userId } = decode(jwt)
    if (userId !== systemUserId) {
      throw Error('you are not authorized to perform this operation')
    }
    return store.find('Media', { owner: ownerId })
  }
}

export default resolvers
