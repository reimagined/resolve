import { COUNTER_INCREASED, COUNTER_DECREASED } from '../event-types'

const aggregate = {
  increase: (_, { payload }) => ({
    type: COUNTER_INCREASED,
    payload,
  }),
  decrease: (_, { payload }) => ({
    type: COUNTER_DECREASED,
    payload,
  }),
}

export default aggregate
