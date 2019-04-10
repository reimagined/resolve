import validate from './validation'
import {
  USER_CREATED,
  USER_CONFIRMED,
  USER_ACTIVATED,
  USER_REJECTED
} from '../event-types'

export default {
  createUser: (state, command) => {
    validate.stateIsAbsent(state, 'User')

    const { name } = command.payload

    validate.fieldRequired(command.payload, 'name')

    return { type: USER_CREATED, payload: { name } }
  },
  confirmUser: ({ confirmed, rejected }) => {
    if (!confirmed && !rejected) return { type: USER_CONFIRMED }
  },
  rejectUser: ({ confirmed, rejected }, { payload: { reason } }) => {
    if (!confirmed && !rejected)
      return { type: USER_REJECTED, payload: { reason } }
  }
}
