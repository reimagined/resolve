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
  exists: async (store, params) => {
    // TODO: read from table
    // const { nickname } = params
    // return store.findOne('Users', { 'profile.nickname': nickname })
    //   ? true
    //   : false
    return false
  },
  user: async (store, { id, name }) => {
    // TODO: read user from table
    // const user =
    //   nickname != null
    //     ? await store.findOne('Users', { 'profile.nickname': nickname })
    //     : id != null
    //     ? await store.findOne('Users', { id })
    //     : null

    // return user
    return null
  }
}

export default resolvers
