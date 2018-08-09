import { LOCATION_CHANGE } from 'react-router-redux'
import {
  OPTIMISTIC_SHARE_SHOPPING_LIST,
  OPTIMISTIC_UNSHARE_SHOPPING_LIST
} from '../../../domain/eventTypes'

const initialState = {
  share: [],
  unshare: []
}

const optimisticSharings = (state = initialState, action) => {
  switch (action.type) {
    case LOCATION_CHANGE: {
      return initialState
    }
    case OPTIMISTIC_SHARE_SHOPPING_LIST: {
      return {
        share: [
          ...state.share,
          {
            id: action.payload.id,
            username: action.payload.username
          }
        ],
        unshare: state.unshare.filter(({ id }) => id !== action.payload.id)
      }
    }
    case OPTIMISTIC_UNSHARE_SHOPPING_LIST: {
      return {
        share: state.share.filter(({ id }) => id !== action.payload.id),
        unshare: [
          ...state.unshare,
          {
            id: action.payload.id,
            username: action.payload.username
          }
        ]
      }
    }
    default: {
      return state
    }
  }
}

export default optimisticSharings
