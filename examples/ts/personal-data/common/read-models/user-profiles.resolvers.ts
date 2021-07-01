import { ReadModelResolvers } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'
import { systemUserId } from '../constants'
import { AuthResolverMiddlewareContext } from '../../types'

const resolvers: ReadModelResolvers<
  ResolveStore,
  AuthResolverMiddlewareContext
> = {
  profile: async (store, params, { user }) => {
    const { userId } = user
    const actualUserId = userId === systemUserId ? params.userId : userId
    return await store.findOne('Users', { id: actualUserId })
  },
  profileById: async (store, params: { userId: string }) => {
    return await store.findOne('Users', { id: params.userId })
  },
  fullNameById: async (store, params: { userId: string }) => {
    const user = await store.findOne('Users', { id: params.userId })

    if (user) {
      return `${user.profile.firstName} ${user.profile.lastName}`
    } else {
      throw Error('User not found')
    }
  },
  all: async (store) => {
    return await store.find('Users', {})
  },
  exists: async (store, params: { nickname: string }) => {
    const { nickname } = params
    const user = await store.findOne('Users', {
      'profile.nickname': nickname,
    })
    return !!user
  },
}

export default resolvers
