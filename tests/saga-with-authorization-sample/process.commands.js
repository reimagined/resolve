import jsonwebtoken from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

const commands = {
  createProcess: () => {
    return {
      type: 'PROCESS_CREATED',
    }
  },

  killAllProcesses: () => {
    return {
      type: 'ALL_PROCESS_KILLED',
    }
  },

  killProcess: (state, command, token) => {
    const jwt = jsonwebtoken.verify(token, jwtSecret)

    if (!jwt.permissions.processes.kill) {
      throw new Error('Access denied')
    }

    return {
      type: 'PROCESS_KILLED',
    }
  },
}

export default commands
