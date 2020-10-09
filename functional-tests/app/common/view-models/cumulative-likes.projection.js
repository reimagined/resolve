import getEventTypes from '../event-types'

export default (options) => {
  const { USER_REGISTERED, USER_LIKED } = getEventTypes(options)

  return {
    Init: () => ({
      likes: -999,
    }),
    [USER_REGISTERED]: (state) => ({
      ...state,
      likes: 0,
    }),
    [USER_LIKED]: (state) => ({
      ...state,
      likes: state.likes + 1,
    }),
  }
}
