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
            updateExprArray.push(`${escapeId(baseName)} = CASE 
              WHEN json_type(${escapeId(baseName)}, '${makeNestedPath(nestedPath)}') IS NOT NULL
              THEN json_remove(${escapeId(baseName)}, '${makeNestedPath(nestedPath)}')
              ELSE json_type((SELECT 'MalformedUnsetOperataion'))
              END
              `)
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
            const baseNestedPath = makeNestedPath(nestedPath.slice(0,-1))
              const lastNestedPathElementType = escapeStr(nestedPath[nestedPath.length-1] != null ?
              (!isNaN(+nestedPath[nestedPath.length-1]) ? 'number' : 'string') :
              'unknown')

            updateExprArray.push(`${escapeId(baseName)} = CASE
              WHEN (json_type(${escapeId(baseName)}, '${baseNestedPath}') || '-' || ${lastNestedPathElementType}) = 'object-string' THEN
              json_set(${escapeId(baseName)}, '${makeNestedPath(nestedPath)}', ${updatingInlinedValue})
              WHEN (json_type(${escapeId(baseName)}, '${baseNestedPath}') || '-' || ${lastNestedPathElementType}) = 'array-number' THEN
              json_set(${escapeId(baseName)}, '${makeNestedPath(nestedPath)}', ${updatingInlinedValue})
              ELSE json_type((SELECT 'MalformedSetOperataion'))
              END
              `)
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
          const sourceInlinedType = nestedPath.length > 0 ? `json_type(${escapeId(baseName)}, '${makeNestedPath(nestedPath)}')` : `json_type(${escapeId(baseName)})`;
            
          const targetInlinedPrefix =
            nestedPath.length > 0
              ? `${escapeId(baseName)} = json_set(${escapeId(
                  baseName
                )}, '${makeNestedPath(nestedPath)}', `
              : `${escapeId(baseName)} = `

          const targetInlinedPostfix = nestedPath.length > 0 ? ')' : ''

          const fieldValueNumberLike = +(fieldValue as number)
          const fieldValueStringLike = escapeStr(`${fieldValue}`)
          const fieldValueType = escapeStr(fieldValue != null ? (
            fieldValue.constructor === String ? 'string' :
            fieldValue.constructor === Number ? (
              Number.isInteger(fieldValueNumberLike) ? 'integer' : 'real'
            ) : 'unknown'
          ) : 'unknown'
          )

          let updatingInlinedValue = `json(CAST(CASE
            WHEN (${sourceInlinedType} || '-' || ${fieldValueType} ) = 'text-string' THEN json_quote(
              CAST(${sourceInlinedValue} AS TEXT) ||
              CAST(${fieldValueStringLike} AS TEXT)
            )
            WHEN (${sourceInlinedType} || '-' || ${fieldValueType} ) = 'integer-integer' THEN (
              CAST(${sourceInlinedValue} AS INTEGER) +
              CAST(${fieldValueNumberLike} AS INTEGER)
            )
            WHEN (${sourceInlinedType} || '-' || ${fieldValueType} ) = 'integer-real' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${fieldValueNumberLike} AS REAL)
            )
            WHEN (${sourceInlinedType} || '-' || ${fieldValueType} ) = 'real-integer' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${fieldValueNumberLike} AS REAL)
            )
            WHEN (${sourceInlinedType} || '-' || ${fieldValueType} ) = 'real-real' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${fieldValueNumberLike} AS REAL)
            )
            ELSE json_type((SELECT 'MalformedIncOperataion'))
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
