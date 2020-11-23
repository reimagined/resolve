import { USER_REGISTERED } from '../event-types'

export default {
  Init: () => null,
  [USER_REGISTERED]: (state, { aggregateId, payload: { name } }) => ({
    id: aggregateId,
    name,
  }),
}
