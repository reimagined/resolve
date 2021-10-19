import { USER_REGISTERED } from '../event-types'

const projection = {
  Init: () => null,
  [USER_REGISTERED]: (state, { aggregateId, payload: { name } }) => ({
    id: aggregateId,
    name,
  }),
}

export default projection
