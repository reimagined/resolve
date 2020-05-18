import { decode } from '../jwt'
import { systemUserId } from '../constants'

const decryptProfile = (decrypt, profile) => ({
  ...profile,
  firstName: decrypt(profile.firstName),
  lastName: decrypt(profile.lastName),
  contacts: decrypt(profile.contacts)
})

const resolvers = {
  profile: async (store, params, { jwt, decrypt }) => {
    const { userId } = decode(jwt)
    const actualUserId = userId === systemUserId ? params.userId : userId
    return decryptProfile(
      decrypt,
      await store.findOne('Users', { id: actualUserId })
    )
  },
  profileById: async (store, params, { jwt, decrypt }) => {
    decode(jwt)
    return decryptProfile(
      decrypt,
      await store.findOne('Users', { id: params.userId })
    )
  },
  all: async store => {
    return store.find('Users', {})
  },
  exists: async (store, params) => {
    const { nickname } = params
    const user = await store.findOne('Users', {
      'profile.nickname': nickname
    })
    return !!user
  }
}

export default resolvers
