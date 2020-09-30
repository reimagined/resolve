import { COUNTER_INCREASED, COUNTER_DECREASED } from '../event-types'

export default {
  Init: () => 0,
  [COUNTER_INCREASED]: (state, { payload }) => {
    if (+state !== +payload) {
      throw new Error(`Expected ${state} but get ${payload} counter value`)
    }
    return state + 1
  },
  [COUNTER_DECREASED]: (state, { payload }) => {
    if (+state !== +payload) {
      throw new Error(`Expected ${state} but get ${payload} counter value`)
    }
    return state - 1
  },
}
