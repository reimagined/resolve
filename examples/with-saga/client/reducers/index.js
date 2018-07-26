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
      default:
        return state
    }
  }
}
