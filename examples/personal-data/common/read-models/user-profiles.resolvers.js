import { decode } from '../jwt'
import { systemUserId } from '../constants'

const resolvers = {
  profile: async (store, params, jwt) => {
    const { userId } = decode(jwt)
    const actualUserId = userId === systemUserId ? params.userId : userId
    return store.findOne('Users', { id: actualUserId })
  },
  all: async store => {
    return store.find('Users', {})
  },
  exists: async (store, params) => {
    const { nickname } = params
    const user = await store.findOne('Users', {
      'profile.nickname': nickname
    })
    return user ? true : false
  }
}

export default resolvers
