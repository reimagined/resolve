import { CommandMiddleware } from '@resolve-js/core'
const middleware: CommandMiddleware = (next) => async (
  state,
  command,
  context
) => {
  const { addedByMiddleware, isOdd } = context as any
  console.log({ addedByMiddleware })
  const event = await next(state, command, context)
  if (isOdd && event.type === 'MY_AGGREGATE_ITEM_ADDED') {
    event.payload.itemName += ', modified by middleware'
  }
  return event
}
export default middleware
