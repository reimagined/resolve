import { USER_CREATED, USER_CONFIRMED, USER_REJECTED } from '../event-types'

export default {
  Init: () => ({}),
  [USER_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp,
    confirmed: false,
    rejected: false
  }),
  [USER_CONFIRMED]: state => ({
    ...state,
    confirmed: true
  }),
  [USER_REJECTED]: state => ({
    ...state,
    rejected: true
  })
}
