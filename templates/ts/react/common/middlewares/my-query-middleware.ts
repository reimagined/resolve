const middleware = (next) => async (resolver, args, context) => {
  console.log('query middleware')
  const data = await next(resolver, args, context)
  const modifiedData = data.map((item) => ({
    ...item,
    name: item.name + ', modified by middleware',
  }))
  return modifiedData
}
export default middleware
