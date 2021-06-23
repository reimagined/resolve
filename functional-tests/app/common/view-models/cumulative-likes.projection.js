import { USER_REGISTERED, USER_LIKED } from '../event-types'

const projection = {
  Init: () => ({
    likes: -999,
  }),
  [USER_REGISTERED]: (state) => ({
    ...state,
    likes: 0,
  }),
  [USER_LIKED]: (state) => ({
    ...state,
    likes: state.likes + 1,
  }),
}

export default projection
