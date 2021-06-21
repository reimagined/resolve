import { USER_CREATED, USER_CONFIRMED, USER_REJECTED } from '../event-types'
const userProjection = {
  Init: () => ({}),
  [USER_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp,
    confirmed: false,
    rejected: false,
  }),
  [USER_CONFIRMED]: (state) => ({
    ...state,
    confirmed: true,
  }),
  [USER_REJECTED]: (state) => ({
    ...state,
    rejected: true,
  }),
}
export default userProjection
