const expressionString = (...strings) => {
  const expression = strings
    .filter(str => str)
    .join(' AND ')
    .trim()
  return expression === '' ? undefined : expression
}

export default expressionString
