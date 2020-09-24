import { USER_REGISTERED } from '../event-types'

export default {
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
