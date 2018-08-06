import {
  USER_CREATION_REQUESTED,
  USER_CREATION_CONFIRMED,
  USER_CREATION_REJECTED,
  OUTDATED_USER_DELETED
} from '../events'

export default {
  createUser: (_, { payload: { email } }) => {
    return {
      type: USER_CREATION_REQUESTED,
      payload: {
        email
      }
    }
  },
  confirmUserCreation: () => {
    return {
      type: USER_CREATION_CONFIRMED
    }
  },
  rejectUserCreation: (_, { payload: { createdUser } }) => {
    return {
      type: USER_CREATION_REJECTED,
      payload: { createdUser }
    }
  },
  deleteOutdatedUser: () => {
    return {
      type: OUTDATED_USER_DELETED
    }
  }
}
