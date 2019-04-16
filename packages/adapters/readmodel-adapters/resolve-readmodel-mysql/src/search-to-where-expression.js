const compareOperatorsMap = new Map([
  ['$eq', '='],
  ['$ne', '<>'],
  ['$lte', '<='],
  ['$gte', '>='],
  ['$lt', '<'],
  ['$gt', '>']
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
          ? `${escapeId(baseName)}->'${makeNestedPath(nestedPath)}'`
          : escapeId(baseName)

      let fieldValue = expression[fieldName]
      let fieldOperator = '$eq'

      if (fieldValue instanceof Object) {
        fieldOperator = Object.keys(fieldValue)[0]
        fieldValue = fieldValue[fieldOperator]
      }

      const compareInlinedValue =
        fieldValue != null
          ? `CAST(${escape(JSON.stringify(fieldValue))} AS JSON)`
          : `CAST("null" AS JSON)`

      const resultOperator = compareOperatorsMap.get(fieldOperator)

      searchExprArray.push(
        `${resultFieldName} ${resultOperator} ${compareInlinedValue}`
      )
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
