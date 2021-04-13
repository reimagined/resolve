import { MONITORING_FAILED_HANDLER } from '../event-types'

export default {
  fail: () => ({
    type: MONITORING_FAILED_HANDLER,
    payload: {},
  }),
}
