import { COUNTER_INCREASED, COUNTER_DECREASED } from '../event-types'

const projection = {
  Init: () => 0,
  [COUNTER_INCREASED]: (state) => {
    return state + 1
  },
  [COUNTER_DECREASED]: (state) => {
    return state - 1
  },
}

export default projection
