import { CommandMiddleware } from '@resolve-js/core'
const middleware: CommandMiddleware = (next) => async (
  middlewareContext,
  state,
  command,
  context
) => {
  const { req, res } = middlewareContext
  console.log({ req, res, command })

  const { addedByMiddleware, isOdd } = context as any
  const event = await next(middlewareContext, state, command, context)
  if (isOdd && event.type === 'MY_AGGREGATE_ITEM_ADDED') {
    event.payload.itemName += addedByMiddleware
  }
  return event
}
export default middleware
