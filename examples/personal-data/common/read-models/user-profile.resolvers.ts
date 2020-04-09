import { Resolvers } from 'resolve-readmodel-base'

const resolvers: Resolvers = {
  profile: async (store, { id }) => store.findOne('Users', { id })
}

export default resolvers
