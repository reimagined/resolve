import { UPDATE_JWT, LOGOUT } from './action_types'

const createJwtReducer = () => (state = {}, action) => {
  switch (action.type) {
    case UPDATE_JWT: {
      return action.jwt
    }
    case LOGOUT: {
      return {}
    }
    default:
      return state
  }
}

export default createJwtReducer
