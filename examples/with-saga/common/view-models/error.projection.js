export default {
  Init: () => ({ errors: [] }),
  UserCreationConfirmed: (state, { payload: { clientId } }) => {
    let clientObj = state.errors[clientId] || {}

    return {
      ...state,
      errors: {
        [clientId]: {
          ...clientObj,
          isError: false
        }
      }
    }
  },
  UserCreationRejected: (
    state,
    { timestamp, payload: { createdUser, clientId } }
  ) => {
    if (!createdUser) {
      return state
    }

    let error = {
      timestamp,
      message: `User with the '${createdUser.email}' email already exists`
    }
    let clientObj = state.errors[clientId] || {}
    let errorsByClient = clientObj.errors || []

    return {
      ...state,
      errors: {
        [clientId]: {
          errors: [errorsByClient, error],
          isError: true
        }
      }
    }
  }
}
