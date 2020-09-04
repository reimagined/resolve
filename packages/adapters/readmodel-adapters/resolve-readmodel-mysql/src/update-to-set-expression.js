const updateToSetExpression = (
  expression,
  escapeId,
  escape,
  makeNestedPath
) => {
  const updateExprArray = []

  for (let operatorName of Object.keys(expression)) {
    for (let fieldName of Object.keys(expression[operatorName])) {
      const fieldValue = expression[operatorName][fieldName]
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
              ? `CAST(${escape(JSON.stringify(fieldValue))} AS JSON)`
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

          let updatingInlinedValue = `CAST(CASE
            WHEN JSON_TYPE(${sourceInlinedValue}) = 'STRING' THEN JSON_QUOTE(CONCAT(
              CAST(JSON_UNQUOTE(${sourceInlinedValue}) AS CHAR),
              CAST(${escape(fieldValue)} AS CHAR)
            ))
            WHEN JSON_TYPE(${sourceInlinedValue}) = 'INTEGER' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${+fieldValue} AS DECIMAL(48, 16))
            )
            WHEN JSON_TYPE(${sourceInlinedValue}) = 'DOUBLE' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${+fieldValue} AS DECIMAL(48, 16))
            )
            WHEN JSON_TYPE(${sourceInlinedValue}) = 'DECIMAL' THEN (
              CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${+fieldValue} AS DECIMAL(48, 16))
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
