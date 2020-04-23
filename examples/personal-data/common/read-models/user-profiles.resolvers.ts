import { ReadModelResolvers } from 'resolve-core'
import { ResolveStore } from 'resolve-readmodel-base'
import { decode } from '../jwt'
import { systemUserId } from '../constants'

const resolvers: ReadModelResolvers<ResolveStore> = {
  profile: async (store, params, jwt) => {
    const { userId } = decode(jwt)
    const actualUserId = userId === systemUserId ? params.userId : userId
    return store.findOne('Users', { id: actualUserId })
  },
  all: async (store, params, jwt) => {
    return store.find('Users', {})
  },
  exists: async (store, params) => {
    return false
    /* // TODO: read from table
    const { nickname } = params
    const user = await store.findOne('Users', { 'profile.nickname': nickname })
    return user ? true : false */
  }
}

export default resolvers
