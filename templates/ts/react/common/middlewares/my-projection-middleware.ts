import { ReadModelProjectionMiddleware } from '@resolve-js/core'

const middleware: ReadModelProjectionMiddleware = (next) => async (
  middlewareContext,
  store,
  event,
  context
) => {
  const { req, res, readModelName } = middlewareContext
  console.log({ req, res, readModelName, event })

  return next(
    middlewareContext,
    store,
    {
      ...event,
      payload: { ...event.payload, extra: 'added by projection middleware' },
    },
    context
  )
}
export default middleware
