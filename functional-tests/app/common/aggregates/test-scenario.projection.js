import {
  TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED,
  TEST_SCENARIO_EXECUTED,
} from '../event-types'

export default {
  Init: () => ({
    isExecuted: false,
    retryOnErrorBlocked: true,
  }),
  [TEST_SCENARIO_EXECUTED]: (state) => {
    return {
      ...state,
      isExecuted: true,
    }
  },
  [TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED]: (state) => {
    return {
      ...state,
      isExecuted: true,
      retryOnErrorBlocked: false,
    }
  },
}
