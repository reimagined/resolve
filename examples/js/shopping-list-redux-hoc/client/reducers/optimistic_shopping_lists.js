import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_REMOVE_SHOPPING_LIST,
  OPTIMISTIC_SYNC,
} from '../actions/optimistic_actions'
const initialState = []
export const optimisticShoppingListsReducer = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case OPTIMISTIC_CREATE_SHOPPING_LIST: {
      return [
        ...state,
        {
          id: action.payload.id,
          name: action.payload.name,
        },
      ]
    }
    case OPTIMISTIC_REMOVE_SHOPPING_LIST: {
      return state.filter((item) => {
        return item.id !== action.payload.id
      })
    }
    case OPTIMISTIC_SYNC: {
      return action.payload.originalLists
    }
    default: {
      return state
    }
  }
}
