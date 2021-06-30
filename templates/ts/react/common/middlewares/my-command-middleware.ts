import { CommandContext, CommandMiddleware } from '@resolve-js/core'

type ExtendedContext = {
  addedByMiddleware: string
  isOdd: boolean
} & CommandContext

const middleware: CommandMiddleware = (next) => async (
  middlewareContext,
  state,
  command,
  context
) => {
  const { req, res } = middlewareContext
  console.log({ req, res, command })

  if (command.type === 'removeItem') {
    throw Error('Forbidden by middleware')
  }

  const modifiedContext: ExtendedContext = {
    ...context,
    addedByMiddleware: ', modified by middleware',
    isOdd: !!((state.items?.length ?? 0) % 2),
  }

  return next(middlewareContext, state, command, modifiedContext)
}
export default middleware
