import {
  OPTIMISTIC_SHARINGS_UPDATE_QUERY,
  OPTIMISTIC_SHARINGS_SYNC,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_SHARE,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_UNSHARE
} from '../actions/optimisticActions'

const initialState = {
  id: '',
  name: '',
  users: {
    sharings: [],
    other: []
  }
}

const optimisticSharings = (state = initialState, action) => {
  switch (action.type) {
    case OPTIMISTIC_SHARINGS_SYNC: {
      return action.payload
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
