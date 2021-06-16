const middleware = (next) => (state, command, context) => {
  if (command.type === 'removeItem') {
    throw Error('Forbidden by middleware')
  }
  return next(state, command, {
    ...context,
    addedByMiddleware: 'Middleware added this',
    isOdd: (state.items?.length ?? 0) % 2,
  })
}
export default middleware
