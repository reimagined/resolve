const middleware = (next) => async (store, event, context) => {
  console.log('projection middleware:')
  return next(
    store,
    {
      ...event,
      payload: { ...event.payload, extra: 'added by projection middleware' },
    },
    context
  )
}
export default middleware
