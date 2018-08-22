import {
  OPTIMISTIC_SHARINGS_SYNC,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_SHARE,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_UNSHARE
} from '../actions/optimisticActions'

const optimisticSharings = (state = [], action) => {
  switch (action.type) {
    case OPTIMISTIC_SHARINGS_SYNC: {
      return action.payload.users
    }
    case OPTIMISTIC_SHARINGS_SHOPPING_LIST_SHARE: {
      return [
        ...state,
        {
          id: action.payload.id,
          username: action.payload.username
        }
      ]
    }
    case OPTIMISTIC_SHARINGS_SHOPPING_LIST_UNSHARE: {
      return state.filter(({ id }) => id !== action.payload.id)
    }
    default: {
      return state
    }
  }
}

export default optimisticSharings
