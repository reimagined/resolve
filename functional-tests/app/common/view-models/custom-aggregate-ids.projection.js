import { COUNTER_INCREASED, COUNTER_DECREASED } from '../event-types'

export default {
  Init: () => 0,
  [COUNTER_INCREASED]: (state) => {
    return state + 1
  },
  [COUNTER_DECREASED]: (state) => {
    return state - 1
  },
}
