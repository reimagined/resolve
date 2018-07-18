import { ROUTE_CHANGED } from '../actions/actionTypes'

const prefetchRoute = (state = null, action) => {
  switch (action.type) {
    case ROUTE_CHANGED: {
      return action.route
    }
    default: {
      return state
    }
  }
}

export default prefetchRoute
