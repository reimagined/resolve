import { USER_REGISTERED } from '../event-types'

export default {
  Init: () => null,
  [USER_REGISTERED]: (state, { aggregateId, payload: { nickname } }) => ({
    id: aggregateId,
    nickname,
  }),
}
