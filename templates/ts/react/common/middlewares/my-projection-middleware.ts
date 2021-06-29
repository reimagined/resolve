import { ProjectionMiddleware } from '@resolve-js/core'

const middleware: ProjectionMiddleware = (next) => async (
  store,
  event,
  context,
  middlewareContext
) => {
  return next(
    store,
    {
      ...event,
      payload: { ...event.payload, extra: 'added by projection middleware' },
    },
    context,
    middlewareContext
  )
}
export default middleware
