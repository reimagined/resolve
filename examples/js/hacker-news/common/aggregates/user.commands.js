import validate from './validation'
import { USER_CREATED, USER_CONFIRMED, USER_REJECTED } from '../event-types'
const userCommands = {
  createUser: (state, command) => {
    validate.stateIsAbsent(state, 'User')
    const { name } = command.payload
    validate.fieldRequired(command.payload, 'name')
    return { type: USER_CREATED, payload: { name } }
  },
  confirmUser: (state, { payload: { name } }) => {
    validate.keyIsNotInObject(state, 'confirmed', 'Already confirmed')
    validate.keyIsNotInObject(state, 'rejected', 'Already rejected')
    return { type: USER_CONFIRMED, payload: { name } }
  },
  rejectUser: (state, { payload: { reason } }) => {
    validate.keyIsNotInObject(state, 'confirmed', 'Already confirmed')
    validate.keyIsNotInObject(state, 'rejected', 'Already rejected')
    return { type: USER_REJECTED, payload: { reason } }
  },
}
export default userCommands
