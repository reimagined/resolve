import { ResolverMiddleware } from '@resolve-js/core'
const middleware: ResolverMiddleware = (middlewareContext) => (next) => async (
  store,
  args,
  context
) => {
  const data = await next(store, args, context)
  const modifiedData = data.map((item) => ({
    ...item,
    name: item.name + ', modified by middleware',
  }))
  return modifiedData
}
export default middleware
