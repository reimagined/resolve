import { HttpError } from '@resolve-js/client'
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

const aggregate = {
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
      payload: {
        scenarioName: 'retry-on-error-read-model',
      },
    }
  },
  executeRetryOnErrorMiddlewareReadModel: (state) => {
    assertNotExecuted(state)
    return {
      type: TEST_SCENARIO_EXECUTED,
      payload: {
        scenarioName: 'retry-on-error-read-model',
        state: {
          blocked: true,
        },
      },
    }
  },
  executeRetryOnErrorMiddlewareViewModel: (state) => {
    assertNotExecuted(state)
    return {
      type: TEST_SCENARIO_EXECUTED,
      payload: {
        scenarioName: 'retry-on-error-view-model',
        state: {
          blocked: true,
        },
      },
    }
  },
  executeArrayWithingQueryString: (state) => {
    assertNotExecuted(state)
    return {
      type: TEST_SCENARIO_EXECUTED,
      payload: {
        scenarioName: 'array-within-query-string',
        state: {},
      },
    }
  },
}

export default aggregate
