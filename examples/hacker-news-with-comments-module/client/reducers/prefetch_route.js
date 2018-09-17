import { ROUTE_CHANGED } from '../actions/action_types'

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
