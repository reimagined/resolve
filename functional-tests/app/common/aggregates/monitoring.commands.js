import { MONITORING_FAILED_HANDLER } from '../event-types'

const aggregate = {
  fail: () => ({
    type: MONITORING_FAILED_HANDLER,
    payload: {},
  }),
}

export default aggregate
