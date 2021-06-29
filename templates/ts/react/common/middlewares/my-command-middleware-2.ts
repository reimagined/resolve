import { CommandMiddleware } from '@resolve-js/core'
const middleware: CommandMiddleware = (next) => async (
  state,
  command,
  context,
  middlewareContext
) => {
  const { addedByMiddleware, isOdd } = context as any
  const event = await next(state, command, context, middlewareContext)
  if (isOdd && event.type === 'MY_AGGREGATE_ITEM_ADDED') {
    event.payload.itemName += addedByMiddleware
  }
  return event
}
export default middleware
