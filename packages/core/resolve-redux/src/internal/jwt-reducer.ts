import { UPDATE_JWT, LOGOUT } from './action-types'

export const create = () => (state = {}, action: any): any => {
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
