import JWT from 'jsonwebtoken'

import jwtSecret from '../auth/jwt-secret'
import validation from './validation'
import { USER_CREATED, USER_NAME_UPDATED } from '../event-types'

export default {
  createUser: (state, command, jwtToken) => {
    const jwt = JWT.verify(jwtToken, jwtSecret)

    validation.stateIsAbsent(state, 'User')
    validation.fieldRequired(command.payload, 'username')
    validation.toEqual(jwt, 'role', 'root')

    return {
      type: USER_CREATED,
      payload: {
        username: command.payload.username,
        passwordHash: command.payload.passwordHash,
        accessTokenHash: command.payload.accessTokenHash
      }
    }
  },
  updateUserName: (state, command, jwtToken) => {
    const jwt = JWT.verify(jwtToken, jwtSecret)

    validation.stateExists(state, 'User')
    validation.fieldRequired(command.payload, 'username')
    validation.toEqual(jwt, 'id', state.userId)

    return {
      type: USER_NAME_UPDATED,
      payload: {
        username: command.payload.username
      }
    }
  }
}
