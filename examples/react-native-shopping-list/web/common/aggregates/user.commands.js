import validation from './validation'

export default {
  createUser: (state, command) => {
    validation.stateIsAbsent(state, 'User')

    validation.fieldRequired(command.payload, 'username')

    return {
      type: 'USER_CREATED',
      payload: {
        username: command.payload.username,
        passwordHash: command.payload.passwordHash,
        accessTokenHash: command.payload.accessTokenHash
      }
    }
  },
  updateUserName: (state, command) => {
    validation.stateExists(state, 'User')

    validation.fieldRequired(command.payload, 'username')

    return {
      type: 'USER_NAME_UPDATED',
      payload: {
        username: command.payload.username
      }
    }
  }
}
