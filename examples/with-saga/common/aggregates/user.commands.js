import {
  USER_CREATION_REQUESTED,
  USER_CREATION_CONFIRMED,
  USER_CREATION_REJECTED,
  OUTDATED_USER_DELETED
} from '../events'

export default {
  createUser: (state, { payload: { email, clientId } }) => {
    if (state) {
      throw new Error('User already exists')
    }
    return {
      type: USER_CREATION_REQUESTED,
      payload: {
        email,
        clientId
      }
    }
  },
  confirmUserCreation: (state, { payload: { clientId } }) => {
    if (!state) {
      throw new Error('User does not exist')
    }

    if (state.isConfirmed) {
      throw new Error('User is already confirmed')
    }

    return {
      type: USER_CREATION_CONFIRMED,
      payload: { clientId }
    }
  },
  rejectUserCreation: (state, { payload: { clientId, createdUser } }) => {
    if (!state) {
      throw new Error('User does not exist')
    }

    if (state.isConfirmed) {
      throw new Error('User is already confirmed')
    }

    return {
      type: USER_CREATION_REJECTED,
      payload: { clientId, createdUser }
    }
  },
  deleteOutdatedUser: state => {
    if (!state) {
      throw new Error('User does not exist')
    }

    if (!state.isConfirmed) {
      throw new Error('User is not confirmed yet')
    }

    return {
      type: OUTDATED_USER_DELETED
    }
  }
}
