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
              `${escapeId(baseName)} = JSON_REMOVE(${escapeId(
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
              ? `CAST(${escapeStr(JSON.stringify(fieldValue))} AS JSON)`
              : null

          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = JSON_SET(${escapeId(
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
              ? `JSON_EXTRACT(${escapeId(baseName)}, '${makeNestedPath(
                  nestedPath
                )}')`
              : escapeId(baseName)

          const targetInlinedPrefix =
            nestedPath.length > 0
              ? `${escapeId(baseName)} = JSON_SET(${escapeId(
                  baseName
                )}, '${makeNestedPath(nestedPath)}', `
              : `${escapeId(baseName)} = `

          const targetInlinedPostfix = nestedPath.length > 0 ? ')' : ''

          const fieldValueNumberLike = +(fieldValue as number)
          const fieldValueStringLike = escapeStr(`${fieldValue}`)

          let updatingInlinedValue = `CAST(CASE
            WHEN JSON_TYPE(${sourceInlinedValue}) = 'STRING' THEN JSON_QUOTE(CONCAT(
              CAST(JSON_UNQUOTE(${sourceInlinedValue}) AS CHAR),
              CAST(${fieldValueStringLike} AS CHAR)
            ))
            WHEN JSON_TYPE(${sourceInlinedValue}) = 'INTEGER' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${fieldValueNumberLike} AS DECIMAL(48, 16))
            )
            WHEN JSON_TYPE(${sourceInlinedValue}) = 'DOUBLE' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${fieldValueNumberLike} AS DECIMAL(48, 16))
            )
            WHEN JSON_TYPE(${sourceInlinedValue}) = 'DECIMAL' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${fieldValueNumberLike} AS DECIMAL(48, 16))
            )
            ELSE (
              SELECT 'Invalid JSON type for $inc operation' 
              FROM information_schema.tables
            )
          END AS JSON)`

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

  return updateExprArray.join(', ')
}

export default updateToSetExpression
