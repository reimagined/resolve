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

      case 'OptimisticSync': {
        return { ...state, users: action.payload.originalUsers }
      }

      case 'UserCreationConfirmed': {
        return {
          ...state,
          users: [...state.users, action.payload.createdUser]
        }
      }
      case 'OutdatedUserDeleted': {
        return {
          ...state,
          users: state.users.filter(item => {
            return item.id !== action.aggregateId
          })
        }
      }
      default:
        return state
    }
  }
}
