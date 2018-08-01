import { UPDATE_JWT } from './action_types'

const createJwtReducer = () => (state = {}, action) => {
  switch (action.type) {
    case UPDATE_JWT: {
      return action.jwt
    }
    default:
      return state
  }
}

export default createJwtReducer
