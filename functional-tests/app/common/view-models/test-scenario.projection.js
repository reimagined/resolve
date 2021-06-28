import { TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED } from '../event-types'

const projection = {
  Init: () => ({ blocked: true }),
  [TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED]: (state) => ({
    ...state,
    blocked: false,
  }),
}

export default projection
