import { USER_REGISTERED } from '../event-types'

export default {
  register: (state, command) => {
    if (state.isExists) {
      throw Error(`the user already exists`)
    }
    return {
      type: USER_REGISTERED,
      payload: {
        name: command.payload.name
      }
    }
  }
}
