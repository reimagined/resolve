import getEventTypes from '../event-types'

export default (options) => {
  const { COUNTER_INCREASED, COUNTER_DECREASED } = getEventTypes(options)
  return {
    Init: () => 0,
    [COUNTER_INCREASED]: (state) => {
      return state + 1
    },
    [COUNTER_DECREASED]: (state) => {
      return state - 1
    },
  }
}
