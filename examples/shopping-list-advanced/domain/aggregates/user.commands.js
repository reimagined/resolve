import jwt from 'jsonwebtoken'

import jwtSecret from '../auth/jwt_secret'
import validation from './validation'
import { USER_CREATED, USER_NAME_UPDATED } from '../event_types'

export default {
  createUser: (state, command) => {
    validation.stateIsAbsent(state, 'User')

    validation.fieldRequired(command.payload, 'username')

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
    jwt.verify(jwtToken, jwtSecret)

    validation.stateExists(state, 'User')

    validation.fieldRequired(command.payload, 'username')

    return {
      type: USER_NAME_UPDATED,
      payload: {
        username: command.payload.username
      }
    }
  }
}
