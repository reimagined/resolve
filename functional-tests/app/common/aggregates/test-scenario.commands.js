import { TEST_SCENARIO_EXECUTED } from '../event-types'

const assertNotExecuted = (state) => {
  if (state.isExecuted) {
    const error = Error(`Test scenario already executed`)
    error.code = 409
    throw error
  }
}

export default {
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
