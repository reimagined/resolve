import { OPTIMISTIC_CREATE_SHOPPING_LIST } from '../actions/optimisticActions'

const optimisticShoppingLists = (state = [], action) => {
  switch (action.type) {
    case 'LOCATION_CHANGE': {
      return []
    }
    case OPTIMISTIC_CREATE_SHOPPING_LIST: {
      return [
        ...state,
        {
          id: action.payload.id,
          name: action.payload.name
        }
      ]
    }
    default: {
      return state
    }
  }
}

export default optimisticShoppingLists
