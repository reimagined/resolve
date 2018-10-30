import {
  OPTIMISTIC_SHARINGS_SYNC,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_SHARE,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_UNSHARE
} from '../action-types'

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
      return {
        ...state,
        users: {
          sharings: [
            ...state.users.sharings,
            {
              id: action.payload.id,
              username: action.payload.username
            }
          ],
          other: state.users.other.filter(({ id }) => id !== action.payload.id)
        }
      }
    }
    case OPTIMISTIC_SHARINGS_SHOPPING_LIST_UNSHARE: {
      return {
        ...state,
        users: {
          sharings: state.users.sharings.filter(
            ({ id }) => id !== action.payload.id
          ),
          other: [
            ...state.users.other,
            {
              id: action.payload.id,
              username: action.payload.username
            }
          ]
        }
      }
    }
    default: {
      return state
    }
  }
}

export default optimisticSharings
