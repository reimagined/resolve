const middleware = (next) => (resolver, args, context) => {
  console.log('query middleware')
  return next(resolver, args, context)
}
export default middleware
