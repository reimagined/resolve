import { CommandContext } from '@resolve-js/core'

type ExtendedContext = {
  addedByMiddleware: string
  isOdd: boolean
} & CommandContext

const middleware: CommandMiddleware = (next) => async (
  state,
  command,
  context,
  middlewareContext
) => {
  const { req, res } = middlewareContext
  console.log({ req, res })
  if (command.type === 'removeItem') {
    throw Error('Forbidden by middleware')
  }

  const modifiedContext: ExtendedContext = {
    ...context,
    addedByMiddleware: ', modified by middleware',
    isOdd: !!((state.items?.length ?? 0) % 2),
  }

  return next(state, command, modifiedContext, middlewareContext)
}
export default middleware
