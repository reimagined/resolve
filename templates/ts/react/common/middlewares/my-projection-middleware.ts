import { ProjectionMiddleware } from '@resolve-js/core'

const middleware: ProjectionMiddleware = (middlewareContext) => (
  next
) => async (store, event, context) => {
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
