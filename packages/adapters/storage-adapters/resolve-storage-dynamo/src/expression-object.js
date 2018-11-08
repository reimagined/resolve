const expressionObject = (...objects) => {
  const expression = Object.create(null)
  Object.assign(expression, ...objects)
  return Object.keys(expression).length === 0 ? undefined : expression
}

export default expressionObject
