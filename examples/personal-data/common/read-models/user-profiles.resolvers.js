import { decode } from '../jwt'
import { systemUserId } from '../constants'
import encryptionFactory from '../encryption-factory'

const decryptProfile = async (secretsManager, user) => {
  const encryption = await encryptionFactory(user.id, secretsManager)
  if (!encryption) {
    return {
      ...user,
      profile: {
        ...user.profile,
        firstName: 'unknown',
        lastName: 'unknown',
        contacts: {}
      }
    }
  }
  const { decrypt } = encryption
  const { profile } = user
  return {
    ...user,
    profile: {
      ...profile,
      firstName: decrypt(profile.firstName),
      lastName: decrypt(profile.lastName),
      contacts: decrypt(profile.contacts)
    }
  }
}

const resolvers = {
  profile: async (store, params, { jwt, secretsManager }) => {
    const { userId } = decode(jwt)
    const actualUserId = userId === systemUserId ? params.userId : userId
    return decryptProfile(
      secretsManager,
      await store.findOne('Users', { id: actualUserId })
    )
  },
  profileById: async (store, params, { jwt, secretsManager }) => {
    decode(jwt)
    return decryptProfile(
      secretsManager,
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
