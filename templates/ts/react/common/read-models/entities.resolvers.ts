import { ReadModelResolvers } from '@resolve-js/core'

const resolvers: ReadModelResolvers<any> = {
  all: async (store) => {
    return await store.find('Entities', {})
  },
}

export default resolvers
