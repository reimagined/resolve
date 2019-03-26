import validate from './validation'
import { USER_CREATED } from '../event-types'

export default {
  createUser: (state, command) => {
    validate.stateIsAbsent(state, 'User')

    const { name } = command.payload

    validate.fieldRequired(command.payload, 'name')

    return { type: USER_CREATED, payload: { name } }
  },
  confirmUser: () => {
    return { type: 'USER_CONFIRMED' }
  },
  activateUser: () => {
    return { type: 'USER_ACTIVATED' }
  },
  rejectUser: () => {
    return { type: 'USER_REJECTED' }
  }
}
