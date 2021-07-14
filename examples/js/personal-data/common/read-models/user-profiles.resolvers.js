import { systemUserId } from '../constants'
const resolvers = {
  profile: async (store, params, { user }) => {
    const { userId } = user
    const actualUserId = userId === systemUserId ? params.userId : userId
    return await store.findOne('Users', { id: actualUserId })
  },
  profileById: async (store, params) => {
    return await store.findOne('Users', { id: params.userId })
  },
  fullNameById: async (store, params) => {
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
  exists: async (store, params) => {
    const { nickname } = params
    const user = await store.findOne('Users', {
      'profile.nickname': nickname,
    })
    return !!user
  },
}
export default resolvers
