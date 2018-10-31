import { REFRESH } from '../action-types'

const initialState = {
  timestamp: Date.now()
}

const refresh = (state = initialState, action) => {
  switch (action.type) {
    case REFRESH: {
      return {
        timestamp: action.payload.timestamp
      }
    }
    default: {
      return state
    }
  }
}

export default refresh
