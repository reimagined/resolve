import { ResolverMiddleware } from '@resolve-js/core'
const middleware: ResolverMiddleware = (next) => async (
  store,
  args,
  context,
  middlewareContext
) => {
  const { req, res } = middlewareContext
  console.log({ req, res })
  const data = await next(store, args, context, middlewareContext)
  const modifiedData = data.map((item) => ({
    ...item,
    name: item.name + ', modified by middleware',
  }))
  return modifiedData
}
export default middleware
