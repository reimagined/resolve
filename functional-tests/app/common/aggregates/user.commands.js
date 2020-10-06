import { USER_REGISTERED, USER_LIKED } from '../event-types'

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
  like: (state) => {
    if (!state.isExists) {
      throw Error(`the user not exist`)
    }
    return {
      type: USER_LIKED,
      payload: {},
    }
  },
}
