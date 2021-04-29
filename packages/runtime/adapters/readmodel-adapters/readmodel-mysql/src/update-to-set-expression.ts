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
  let inlineTableNameIdx = 0

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
                  ? 'NUMBER'
                  : 'STRING'
                : 'UNKNOWN'
            )

            updateExprArray.push(`${escapeId(baseName)} = CASE
              WHEN CONCAT(JSON_TYPE(JSON_EXTRACT(${escapeId(
                baseName
              )}, '${baseNestedPath}')),  '-', ${lastNestedPathElementType}) = 'OBJECT-STRING' THEN
              JSON_SET(${escapeId(baseName)}, '${makeNestedPath(
              nestedPath
            )}', ${updatingInlinedValue})
              WHEN CONCAT(JSON_TYPE(JSON_EXTRACT(${escapeId(
                baseName
              )}, '${baseNestedPath}')),  '-', ${lastNestedPathElementType}) = 'ARRAY-NUMBER' THEN
              JSON_SET(${escapeId(baseName)}, '${makeNestedPath(
              nestedPath
            )}', ${updatingInlinedValue})
              ELSE JSON_TYPE((SELECT 'MalformedSetOperation' FROM information_schema.tables LIMIT 1))
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

          const fieldValueNumberLike = +(fieldValue as number)
          const fieldValueStringLike = escapeStr(`${fieldValue}`)

          const fieldValueType = escapeStr(
            fieldValue != null
              ? fieldValue.constructor === String
                ? 'STRING'
                : fieldValue.constructor === Number
                ? Number.isInteger(fieldValue)
                  ? 'INTEGER'
                  : 'DOUBLE'
                : 'UNKNOWN'
              : 'UNKNOWN'
          )

          const inlineTableName = escapeId(
            `inline-table-${inlineTableNameIdx++}`
          )
          let updatingInlinedValue = `(SELECT ${
            nestedPath.length > 0
              ? `JSON_EXTRACT(JSON_ARRAY(JSON_SET(${escapeId(
                  baseName
                )}, '${makeNestedPath(
                  nestedPath
                )}', ${inlineTableName}.\`value\`), ${inlineTableName}.\`value\`), '$[0]')`
              : `${inlineTableName}.\`value\``
          }
            FROM (SELECT CAST(CASE
            WHEN CONCAT(${sourceInlinedType}, '-', ${fieldValueType} ) = 'STRING-STRING' THEN JSON_QUOTE(
              CONCAT(CAST(${sourceInlinedValue} AS CHAR),
              CAST(${fieldValueStringLike} AS CHAR))
            )
            WHEN CONCAT(${sourceInlinedType}, '-', ${fieldValueType} ) = 'INTEGER-INTEGER' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${fieldValueNumberLike} AS DECIMAL(48, 16))
            )
            WHEN CONCAT(${sourceInlinedType}, '-', ${fieldValueType} ) = 'INTEGER-DOUBLE' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${fieldValueNumberLike} AS DECIMAL(48, 16))
            )
            WHEN CONCAT(${sourceInlinedType}, '-', ${fieldValueType} ) = 'DOUBLE-INTEGER' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${fieldValueNumberLike} AS DECIMAL(48, 16))
            )
            WHEN CONCAT(${sourceInlinedType}, '-', ${fieldValueType} ) = 'DOUBLE-DOUBLE' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${fieldValueNumberLike} AS DECIMAL(48, 16))
            )
            ELSE JSON_TYPE((SELECT 'MalformedIncOperation' FROM information_schema.tables LIMIT 1))
          END AS JSON) AS \`value\`) ${inlineTableName})
          `

          updateExprArray.push(
            `${escapeId(baseName)} = ${updatingInlinedValue}`
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
