import { TEST_SCENARIO_EXECUTED } from '../event-types'

export default {
  Init: () => ({
    isExecuted: false,
  }),
  [TEST_SCENARIO_EXECUTED]: (state) => ({
    ...state,
    isExecuted: true,
  }),
}
