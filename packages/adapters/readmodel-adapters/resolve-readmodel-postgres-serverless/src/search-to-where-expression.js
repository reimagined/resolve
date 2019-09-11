const compareOperatorsMap = new Map([
  [
    '$eq',
    (a, b) => `
    (((${a} = ${b}) and (not (${a} is null)) and (not (${b} is null))) or      
    ((${a} is null) and (${b} is null)))
  `
  ],
  [
    '$ne',
    (a, b) => `
    (((${a} <> ${b}) and (not (${a} is null)) and (not (${b} is null))) or      
    ((${a} is null) and (not (${b} is null)) ) or                           
    ((${b} is null) and (not (${a} is null)) ))
  `
  ],
  [
    '$lte',
    (a, b) => `
    (((${a} <= ${b}) and (not (${a} is null)) and (not (${b} is null))) or
    ((${a} is null) and (${b} is null)))
  `
  ],
  [
    '$gte',
    (a, b) => `
    (((${a} >= ${b}) and (not (${a} is null)) and (not (${b} is null))) or
    ((${a} is null) and (${b} is null)))
  `
  ],
  [
    '$lt',
    (a, b) => `
    (((${a} < ${b}) and (not (${a} is null)) and (not (${b} is null))))
  `
  ],
  [
    '$gt',
    (a, b) => `
    (((${a} > ${b}) and (not (${a} is null)) and (not (${b} is null))))
  `
  ]
])

const searchToWhereExpression = (
  expression,
  escapeId,
  escape,
  makeNestedPath
) => {
  const searchExprArray = []
  const isDocumentExpr =
    expression.$and == null && expression.$or == null && expression.$not == null

  if (isDocumentExpr) {
    for (let fieldName of Object.keys(expression)) {
      const [baseName, ...nestedPath] = fieldName.split('.')
      const resultFieldName =
        nestedPath.length > 0
          ? `${escapeId(baseName)} #> '${makeNestedPath(nestedPath)}'`
          : escapeId(baseName)

      let fieldValue = expression[fieldName]
      let fieldOperator = '$eq'

      if (fieldValue instanceof Object) {
        fieldOperator = Object.keys(fieldValue)[0]
        fieldValue = fieldValue[fieldOperator]
      }

      const compareInlinedValue =
        fieldValue != null
          ? `CAST(${escape(JSON.stringify(fieldValue))} AS JSONB)`
          : `CAST(${escape('null')} AS JSONB)`

      const resultExpression = compareOperatorsMap.get(fieldOperator)(
        resultFieldName,
        compareInlinedValue
      )

      searchExprArray.push(resultExpression)
    }

    return searchExprArray.join(' AND ')
  }

  for (let operatorName of Object.keys(expression)) {
    if (operatorName === '$and' || operatorName === '$or') {
      const localSearchExprArray = []
      for (let innerExpr of expression[operatorName]) {
        const whereExpr = searchToWhereExpression(
          innerExpr,
          escapeId,
          escape,
          makeNestedPath
        )
        localSearchExprArray.push(whereExpr)
      }

      const joiner = operatorName === '$and' ? ' AND ' : ' OR '
      if (localSearchExprArray.length > 1) {
        searchExprArray.push(
          localSearchExprArray.map(val => `(${val})`).join(joiner)
        )
      } else {
        searchExprArray.push(localSearchExprArray[0])
      }
      break
    }

    if (operatorName === '$not') {
      const whereExpr = searchToWhereExpression(
        expression[operatorName],
        escapeId,
        escape,
        makeNestedPath
      )

      searchExprArray.push(`NOT (${whereExpr})`)
      break
    }
  }

  return searchExprArray.join(' AND ')
}

export default searchToWhereExpression
