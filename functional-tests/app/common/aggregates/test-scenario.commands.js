import { HttpError } from 'resolve-client'
import {
  TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED,
  TEST_SCENARIO_EXECUTED,
  TEST_SCENARIO_RETRY_ON_ERROR_COMPLETED,
} from '../event-types'

const assertNotExecuted = (state) => {
  if (state.isExecuted) {
    throw HttpError(409, `Test scenario already executed`)
  }
}

export default {
  blockedRetryOnErrorMiddleware: (state) => {
    if (state.retryOnErrorBlocked) {
      throw HttpError(500, 'Test scenario test error to ignore on client')
    }
    return {
      type: TEST_SCENARIO_RETRY_ON_ERROR_COMPLETED,
      payload: {},
    }
  },
  unblockRetryOnErrorMiddleware: () => {
    return {
      type: TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED,
      payload: {},
    }
  },
  executeRequestMiddleware: (state) => {
    assertNotExecuted(state)
    return {
      type: TEST_SCENARIO_EXECUTED,
      payload: {
        scenarioName: 'request-middleware',
      },
    }
  },
}
