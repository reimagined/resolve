import { USER_CREATED } from '../event_types'

export default {
  Init: () => ({}),
  [USER_CREATED]: (state, { aggregateId, timestamp }) => ({
    ...state,
    createdAt: timestamp,
    userId: aggregateId
  })
}
