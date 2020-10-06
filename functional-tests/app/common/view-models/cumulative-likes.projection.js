import { USER_LIKED, USER_REGISTERED } from '../event-types'

export default {
  Init: () => {},
  [USER_REGISTERED]: (state, { aggregateId }) => ({
    ...state,
    [aggregateId]: 0,
  }),
  [USER_LIKED]: (state, { aggregateId }) => ({
    ...state,
    [aggregateId]: state[aggregateId] + 1,
  }),
}
