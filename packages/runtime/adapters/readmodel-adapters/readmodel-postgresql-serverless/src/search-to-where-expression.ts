import type {
  ObjectFixedUnionToIntersectionByKeys,
  SearchToWhereExpressionMethod,
  ObjectDictionaryKeys,
  ObjectFixedKeys,
} from './types'

const compareOperators = {
  $eq: (a: string, b: string): string => `
    (((${a} = ${b}) and (not (${a} is null)) and (not (${b} is null))) or      
    ((${a} is null) and (${b} is null)))
  `,
  $ne: (a: string, b: string): string => `
    (((${a} <> ${b}) and (not (${a} is null)) and (not (${b} is null))) or      
    ((${a} is null) and (not (${b} is null)) ) or                           
    ((${b} is null) and (not (${a} is null)) ))
  `,
  $lte: (a: string, b: string): string => `
    (((${a} <= ${b}) and (not (${a} is null)) and (not (${b} is null))) or
    ((${a} is null) and (${b} is null)))
  `,
  $gte: (a: string, b: string): string => `
    (((${a} >= ${b}) and (not (${a} is null)) and (not (${b} is null))) or
    ((${a} is null) and (${b} is null)))
  `,
  $lt: (a: string, b: string): string => `
    (((${a} < ${b}) and (not (${a} is null)) and (not (${b} is null))))
  `,
  $gt: (a: string, b: string): string => `
    (((${a} > ${b}) and (not (${a} is null)) and (not (${b} is null))))
  `,
}

const searchToWhereExpression: SearchToWhereExpressionMethod = (
  expression,
  escapeId,
  escapeStr,
  makeNestedPath
) => {
  const searchExprArray: Array<string> = []
  const isDocumentExpr = !(
    '$and' in expression ||
    '$or' in expression ||
    '$not' in expression
  )

  if (isDocumentExpr) {
    for (let fieldName of Object.keys(expression)) {
      const [baseName, ...nestedPath] = fieldName.split('.')
      const resultFieldName =
        nestedPath.length > 0
          ? `${escapeId(baseName)} #> '${makeNestedPath(nestedPath)}'`
          : escapeId(baseName)

      let fieldValue = (expression as ObjectDictionaryKeys<typeof expression>)[
        fieldName
      ]
      let fieldOperator: keyof typeof compareOperators = '$eq'

      if (fieldValue instanceof Object) {
        fieldOperator = (Object.keys(fieldValue) as Array<
          ObjectFixedKeys<typeof fieldValue>
        >)[0]
        fieldValue = (fieldValue as ObjectFixedUnionToIntersectionByKeys<
          typeof fieldValue,
          typeof fieldOperator
        >)[fieldOperator]
      }

      const compareInlinedValue =
        fieldValue != null
          ? `CAST(${escapeStr(JSON.stringify(fieldValue))} AS JSONB)`
          : `CAST(${escapeStr('null')} AS JSONB)`

      const resultExpression = compareOperators[fieldOperator](
        resultFieldName,
        compareInlinedValue
      )

      searchExprArray.push(resultExpression)
    }

    return searchExprArray.join(' AND ')
  }

  for (let operatorName of Object.keys(expression)) {
    if (operatorName === '$and' || operatorName === '$or') {
      const localSearchExprArray: Array<string> = []
      for (let innerExpr of (expression as ObjectFixedUnionToIntersectionByKeys<
        typeof expression,
        typeof operatorName
      >)[operatorName]) {
        const whereExpr = searchToWhereExpression(
          innerExpr,
          escapeId,
          escapeStr,
          makeNestedPath
        )
        localSearchExprArray.push(whereExpr)
      }

      const joiner = operatorName === '$and' ? ' AND ' : ' OR '
      if (localSearchExprArray.length > 1) {
        searchExprArray.push(
          localSearchExprArray.map((val) => `(${val})`).join(joiner)
        )
      } else {
        searchExprArray.push(localSearchExprArray[0])
      }
      break
    }

    if (operatorName === '$not') {
      const whereExpr = searchToWhereExpression(
        (expression as ObjectFixedUnionToIntersectionByKeys<
          typeof expression,
          typeof operatorName
        >)[operatorName],
        escapeId,
        escapeStr,
        makeNestedPath
      )

      searchExprArray.push(`NOT (${whereExpr})`)
      break
    }
  }

  return searchExprArray.join(' AND ')
}

export default searchToWhereExpression
