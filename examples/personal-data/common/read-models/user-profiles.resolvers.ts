import { Resolvers } from 'resolve-readmodel-base'
import { decode } from '../jwt'

const resolvers: Resolvers = {
  profile: async (store, _, jwt) => {
    const { userId } = decode(jwt)
    return store.findOne('Users', { id: userId })
  }
}

export default resolvers
