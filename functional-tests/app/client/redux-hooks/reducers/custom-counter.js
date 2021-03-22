import { COUNTER_INCREMENT, COUNTER_STATE_UPDATE } from '../custom-actions'

const customCounter = (state = {}, action) => {
  switch (action.type) {
    case COUNTER_INCREMENT:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          byEvents: ~~state[action.payload.id].byEvents + 1,
        },
      }
    case COUNTER_STATE_UPDATE:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          byState: action.payload.counter,
        },
      }
    default:
      return state
  }
}

export { customCounter }
