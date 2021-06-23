import { CommandContext, CommandMiddleware } from '@resolve-js/core'

type ExtendedContext = {
  addedByMiddleware: string
  isOdd: boolean
} & CommandContext

const middleware: CommandMiddleware = (next) => async (
  state,
  command,
  context
) => {
  if (command.type === 'removeItem') {
    throw Error('Forbidden by middleware')
  }

  const modifiedContext: ExtendedContext = {
    ...context,
    addedByMiddleware: 'Middleware added this',
    isOdd: !!((state.items?.length ?? 0) % 2),
  }

  return next(state, command, modifiedContext)
}
export default middleware
