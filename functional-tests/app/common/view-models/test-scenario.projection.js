import { TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED } from '../event-types'

export default {
  Init: () => ({ blocked: true }),
  [TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED]: (state) => ({
    ...state,
    blocked: false,
  }),
}
