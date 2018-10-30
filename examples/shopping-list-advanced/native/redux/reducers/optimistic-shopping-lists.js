import {
  OPTIMISTIC_SHOPPING_LIST_SYNC,
  OPTIMISTIC_SHOPPING_LIST_CREATE,
  OPTIMISTIC_SHOPPING_LIST_REMOVE
} from '../action-types'

const optimisticShoppingLists = (state = [], action) => {
  switch (action.type) {
    case OPTIMISTIC_SHOPPING_LIST_SYNC: {
      return action.payload
    }
    case OPTIMISTIC_SHOPPING_LIST_CREATE: {
      return [
        ...state,
        {
          id: action.payload.id,
          name: action.payload.name
        }
      ]
    }
    case OPTIMISTIC_SHOPPING_LIST_REMOVE: {
      return state.filter(({ id }) => id !== action.payload.id)
    }
    default: {
      return state
    }
  }
}

export default optimisticShoppingLists
