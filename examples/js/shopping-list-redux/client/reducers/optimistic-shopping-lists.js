import {
  SHOPPING_LISTS_ACQUIRED,
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_REMOVED,
} from '../actions/optimistic-actions'
const initialState = []
const optimisticShoppingLists = (state = initialState, action) => {
  switch (action.type) {
    case SHOPPING_LIST_CREATED: {
      return [
        ...state,
        {
          id: action.payload.id,
          name: action.payload.name,
        },
      ]
    }
    case SHOPPING_LIST_REMOVED: {
      return state.filter((item) => {
        return item.id !== action.payload.id
      })
    }
    case SHOPPING_LISTS_ACQUIRED: {
      return action.payload.lists
    }
    default: {
      return state
    }
  }
}
export default optimisticShoppingLists
