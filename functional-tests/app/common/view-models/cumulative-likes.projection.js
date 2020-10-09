import { USER_LIKED, USER_REGISTERED } from '../event-types'

export default {
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
