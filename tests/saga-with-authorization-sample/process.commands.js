import jsonwebtoken from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

export default {
  createProcess: () => {
    return {
      type: 'PROCESS_CREATED'
    }
  },

  killAllProcesses: () => {
    return {
      type: 'ALL_PROCESS_KILLED'
    }
  },

  killProcess: (state, command, jwtToken) => {
    const jwt = jsonwebtoken.verify(jwtToken, jwtSecret)

    if (!jwt.permissions.processes.kill) {
      throw new Error('Access denied')
    }

    return {
      type: 'PROCESS_KILLED'
    }
  }
}
