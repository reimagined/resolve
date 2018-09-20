import { USER_CREATED } from '../event-types'

export default {
  Init: () => ({}),
  [USER_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp
  })
}
