import getEventTypes from '../event-types'

export default (options) => {
  const { USER_REGISTERED } = getEventTypes(options)
  return {
    Init: () => ({
      isExist: false,
    }),
    [USER_REGISTERED]: (state) => ({
      ...state,
      isExist: true,
    }),
  }
}
