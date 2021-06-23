import { ResolverMiddleware } from '@resolve-js/core'
const middleware: ResolverMiddleware = (next) => async (
  store,
  args,
  context
) => {
  console.log('resolver middleware')
  const data = await next(store, args, context)
  const modifiedData = data.map((item) => ({
    ...item,
    name: item.name + ', modified by middleware',
  }))
  return modifiedData
}
export default middleware
