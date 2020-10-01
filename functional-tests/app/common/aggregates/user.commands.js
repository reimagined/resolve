import getEventTypes from '../event-types'

export default (options) => {
  const { USER_REGISTERED } = getEventTypes(options)
  return {
    register: (state, command, { encrypt }) => {
      if (state.isExists) {
        throw Error(`the user already exists`)
      }
      return {
        type: USER_REGISTERED,
        payload: {
          name: command.payload.name,
          creditCard: encrypt(command.payload.creditCard),
        },
      }
    },
  }
}
