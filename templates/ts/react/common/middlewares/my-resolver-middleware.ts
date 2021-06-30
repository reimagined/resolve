import { ReadModelResolverMiddleware } from '@resolve-js/core'
const middleware: ReadModelResolverMiddleware = (next) => async (
  middlewareContext,
  store,
  args,
  context
) => {
  const { req, res, readModelName, resolverName } = middlewareContext
  console.log({ req, res, readModelName, resolverName })
  const data = await next(middlewareContext, store, args, context)
  const modifiedData = data.map((item) => ({
    ...item,
    name: item.name + ', modified by middleware',
  }))
  return modifiedData
}
export default middleware
