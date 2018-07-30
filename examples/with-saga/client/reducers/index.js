import Immutable from 'seamless-immutable'

export const initialState = Immutable({})

export default {
  user: (state = initialState, action) => {
    switch (action.type) {
      case 'startLoading': {
        return { ...state, disableButton: true }
      }
      case 'endLoading': {
        return { ...state, disableButton: false }
      }
      case 'UserCreationRejected': {
        return { ...state, isError: true }
      }
      case 'UserCreationConfirmed': {
        return { ...state, isError: false }
      }
      default:
        return state
    }
  }
}
