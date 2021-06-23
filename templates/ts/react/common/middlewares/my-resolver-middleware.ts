import { ResolverMiddleware } from '@resolve-js/core'
const middleware: ResolverMiddleware = (next) => async (
  resolver,
  args,
  context
) => {
  console.log('resolver middleware')
  const data = await next(resolver, args, context)
  const modifiedData = data.map((item) => ({
    ...item,
    name: item.name + ', modified by middleware',
  }))
  return modifiedData
}
export default middleware
