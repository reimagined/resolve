import getEventTypes from '../event-types'

export default (options) => {
  const { USER_REGISTERED } = getEventTypes(options)
  return {
    Init: () => null,
    [USER_REGISTERED]: (state, { aggregateId, payload: { name } }) => ({
      id: aggregateId,
      name,
    }),
  }
}
