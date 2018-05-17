import {
  USER_CREATION_REQUESTED,
  USER_CREATION_CONFIRMED,
  USER_CREATION_REJECTED,
  OUTDATED_USER_DELETED
} from '../event-names'

export default {
  name: 'user',
  initialState: null,
  commands: {
    createUser: (state, { payload: { email } }) => {
      if (state) {
        throw new Error('User already exists')
      }

      return {
        type: USER_CREATION_REQUESTED,
        payload: {
          email
        }
      }
    },
    confirmUserCreation: state => {
      if (!state) {
        throw new Error('User does not exist')
      }

      if (state.isConfirmed) {
        throw new Error('User is already confirmed')
      }

      return {
        type: USER_CREATION_CONFIRMED
      }
    },
    rejectUserCreation: state => {
      if (!state) {
        throw new Error('User does not exist')
      }

      if (state.isConfirmed) {
        throw new Error('User is already confirmed')
      }

      return {
        type: USER_CREATION_REJECTED
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
  },
  projection: {
    [USER_CREATION_REQUESTED]: () => ({
      isConfirmed: false
    }),
    [USER_CREATION_CONFIRMED]: state => ({
      ...state,
      isConfirmed: true
    }),
    [USER_CREATION_REJECTED]: () => null,
    [OUTDATED_USER_DELETED]: () => null
  }
}
