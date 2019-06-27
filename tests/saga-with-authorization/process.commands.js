import jsonwebtoken from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

export default {
  killProcess: (state, command, jwtToken) => {
    const jwt = jsonwebtoken.verify(jwtToken, jwtSecret)

    if(!jwt.permissions.processes.kill) {
      throw new Error('Access denied')
    }

    return {
      type: 'PROCESS_KILLED'
    }
  }
}
