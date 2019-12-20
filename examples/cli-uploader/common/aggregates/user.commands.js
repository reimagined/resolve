import jsonwebtoken from 'jsonwebtoken'
import jwtSecret from '../jwt_secret'

import { USER_CREATED } from '../event-types'

export default {
  createUser: (state, command, jwtToken) => {
    jsonwebtoken.verify(jwtToken, jwtSecret)

    const { login, passwordHash } = command.payload

    return {
      type: USER_CREATED,
      payload: { login, passwordHash }
    }
  }
}
