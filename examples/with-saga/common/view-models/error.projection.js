export default {
  Init: () => ({ errors: [], isError: false }),
  UserCreationRequested: state => ({ ...state }),
  OutdatedUserDeleted: state => ({ ...state }),
  UserCreationConfirmed: state => {
    return {
      ...state,
      errors: [...state.errors],
      isError: false
    }
  },
  UserCreationRejected: (state, { timestamp, payload: { createdUser } }) => {
    if (!createdUser) {
      return state
    }

    let error = {
      timestamp,
      message: `User with the '${createdUser.email}' email already exists`
    }

    return {
      ...state,
      errors: [...state.errors, error],
      isError: true
    }
  }
}
