import type {
  ObjectFixedUnionToIntersectionByKeys,
  UpdateToSetExpressionMethod,
  ObjectFixedKeys,
} from './types'

const updateToSetExpression: UpdateToSetExpressionMethod = (
  expression,
  escapeId,
  escapeStr,
  makeNestedPath,
  splitNestedPath
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
      const [baseName, ...nestedPath] = splitNestedPath(fieldName)

      switch (operatorName) {
        case '$unset': {
          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = CASE 
              WHEN JSON_TYPE(JSON_EXTRACT(${escapeId(
                baseName
              )}, '${makeNestedPath(nestedPath)}')) IS NOT NULL
              THEN JSON_REMOVE(${escapeId(baseName)}, '${makeNestedPath(
                nestedPath
              )}')
              ELSE JSON_TYPE((SELECT 'MalformedUnsetOperation' FROM information_schema.tables LIMIT 1))
              END
              `
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
              : `CAST('null' AS JSON)`

          if (nestedPath.length > 0) {
            const baseNestedPath = makeNestedPath(nestedPath.slice(0, -1))
            const lastNestedPathElementType = escapeStr(
              nestedPath[nestedPath.length - 1] != null
                ? !isNaN(+nestedPath[nestedPath.length - 1])
                  ? 'number'
                  : 'string'
                : 'unknown'
            )

            updateExprArray.push(`${escapeId(baseName)} = CASE
              WHEN CONCAT(JSON_TYPE(JSON_EXTRACT(${escapeId(
                baseName
              )}, '${baseNestedPath}')),  '-', ${lastNestedPathElementType}) = 'object-string' THEN
              JSON_SET(${escapeId(baseName)}, '${makeNestedPath(
              nestedPath
            )}', ${updatingInlinedValue})
              WHEN CONCAT(JSON_TYPE(JSON_EXTRACT(${escapeId(
                baseName
              )}, '${baseNestedPath}')),  '-', ${lastNestedPathElementType}) = 'array-number' THEN
              JSON_SET(${escapeId(baseName)}, '${makeNestedPath(
              nestedPath
            )}', ${updatingInlinedValue})
              ELSE JSON_TYPE((SELECT 'MalformedUnsetOperation' FROM information_schema.tables LIMIT 1))
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
              ? `JSON_EXTRACT(${escapeId(baseName)}, '${makeNestedPath(
                  nestedPath
                )}')`
              : escapeId(baseName)
          const sourceInlinedType =
            nestedPath.length > 0
              ? `JSON_TYPE(JSON_EXTRACT(${escapeId(
                  baseName
                )}, '${makeNestedPath(nestedPath)}'))`
              : `JSON_TYPE(${escapeId(baseName)})`

          const targetInlinedPrefix =
            nestedPath.length > 0
              ? `${escapeId(baseName)} = JSON_SET(${escapeId(
                  baseName
                )}, '${makeNestedPath(nestedPath)}', `
              : `${escapeId(baseName)} = `

          const targetInlinedPostfix = nestedPath.length > 0 ? ')' : ''

          const fieldValueNumberLike = +(fieldValue as number)
          const fieldValueStringLike = escapeStr(`${fieldValue}`)

          const fieldValueType = escapeStr(
            fieldValue != null
              ? fieldValue.constructor === String
                ? 'string'
                : fieldValue.constructor === Number
                ? 'number'
                : 'unknown'
              : 'unknown'
          )

          let updatingInlinedValue = `json(CAST(CASE
            WHEN CONCAT(${sourceInlinedType}, '-', ${fieldValueType} ) = 'string-string' THEN JSON_QUOTE(
              CAST(${sourceInlinedValue} AS CHAR) ||
              CAST(${fieldValueStringLike} AS CHAR)
            )
            WHEN CONCAT(${sourceInlinedType}, '-', ${fieldValueType} ) = 'integer-integer' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${fieldValueNumberLike} AS DECIMAL(48, 16))
            )
            ELSE JSON_TYPE((SELECT 'MalformedIncOperation' FROM information_schema.tables LIMIT 1))
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

  return updateExprArray.join(', ')
}

export default updateToSetExpression
