import getEventTypes from '../event-types'

export default (options) => {
  const { COUNTER_INCREASED, COUNTER_DECREASED } = getEventTypes(options)
  return {
    increase: (_, { payload }) => ({
      type: COUNTER_INCREASED,
      payload,
    }),
    decrease: (_, { payload }) => ({
      type: COUNTER_DECREASED,
      payload,
    }),
  }
}
