import type {
  ObjectFixedUnionToIntersectionByKeys,
  UpdateToSetExpressionMethod,
  ObjectFixedKeys,
} from './types'

const updateToSetExpression: UpdateToSetExpressionMethod = (
  expression,
  escapeId,
  escapeStr,
  makeNestedPath
) => {
  const updateExprArray: Array<string> = []

  for (let operatorName of Object.keys(expression) as Array<
    ObjectFixedKeys<typeof expression>
  >) {
    const extractedExpression = (expression as ObjectFixedUnionToIntersectionByKeys<
      typeof expression,
      typeof operatorName
    >)[operatorName]
    for (let fieldName of Object.keys(extractedExpression)) {
      const fieldValue = extractedExpression[fieldName]
      const [baseName, ...nestedPath] = fieldName.split('.')

      switch (operatorName) {
        case '$unset': {
          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = json_remove(${escapeId(
                baseName
              )}, '${makeNestedPath(nestedPath)}') `
            )
          } else {
            updateExprArray.push(`${escapeId(baseName)} = NULL `)
          }
          break
        }

        case '$set': {
          let updatingInlinedValue =
            fieldValue != null
              ? `json(CAST(${escapeStr(JSON.stringify(fieldValue))} AS BLOB))`
              : null

          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = json_set(${escapeId(
                baseName
              )}, '${makeNestedPath(nestedPath)}', ${updatingInlinedValue}) `
            )
          } else {
            updateExprArray.push(
              `${escapeId(baseName)} = ${updatingInlinedValue} `
            )
          }

          break
        }

        case '$inc': {
          const sourceInlinedValue =
            nestedPath.length > 0
              ? `json_extract(${escapeId(baseName)}, '${makeNestedPath(
                  nestedPath
                )}')`
              : escapeId(baseName)

          const targetInlinedPrefix =
            nestedPath.length > 0
              ? `${escapeId(baseName)} = json_set(${escapeId(
                  baseName
                )}, '${makeNestedPath(nestedPath)}', `
              : `${escapeId(baseName)} = `

          const targetInlinedPostfix = nestedPath.length > 0 ? ')' : ''

          const fieldValueNumberLike = +(fieldValue as number)
          const fieldValueIsInteger = Number.isInteger(fieldValueNumberLike)
          const fieldValueStringLike = escapeStr(`${fieldValue}`)

          let updatingInlinedValue = `json(CAST(CASE
            WHEN json_type(${sourceInlinedValue}) = 'text' THEN (
              CAST(${sourceInlinedValue} AS TEXT) ||
              CAST(${fieldValueStringLike} AS TEXT)
            )
            WHEN (json_type(${sourceInlinedValue}) || ${
            fieldValueIsInteger ? `'-integer'` : `'-real'`
          }) = 'integer-integer' THEN (
              CAST(${sourceInlinedValue} AS INTEGER) +
              CAST(${fieldValueNumberLike} AS INTEGER)
            )
            WHEN (json_type(${sourceInlinedValue}) || ${
            fieldValueIsInteger ? `'-integer'` : `'-real'`
          }) = 'integer-real' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${fieldValueNumberLike} AS REAL)
            )
            WHEN (json_type(${sourceInlinedValue}) || ${
            fieldValueIsInteger ? `'-integer'` : `'-real'`
          }) = 'real-integer' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${fieldValueNumberLike} AS REAL)
            )
            WHEN (json_type(${sourceInlinedValue}) || ${
            fieldValueIsInteger ? `'-integer'` : `'-real'`
          }) = 'real-real' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${fieldValueNumberLike} AS REAL)
            )

            ELSE (
              SELECT 'Invalid JSON type for $inc operation' 
              FROM sqlite_master
            )
          END AS BLOB))`

          updateExprArray.push(
            `${targetInlinedPrefix} ${updatingInlinedValue} ${targetInlinedPostfix}`
          )

          break
        }

        default:
          break
      }
    }
  }

  return updateExprArray
}

export default updateToSetExpression
