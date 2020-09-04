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
              ? `json(CAST(${escape(JSON.stringify(fieldValue))} AS BLOB))`
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

          let updatingInlinedValue = `json(CAST(CASE
            WHEN json_type(${sourceInlinedValue}) = 'text' THEN (
              CAST(${sourceInlinedValue} AS TEXT) ||
              CAST(${escape(fieldValue)} AS TEXT)
            )
            WHEN (json_type(${sourceInlinedValue}) || ${
            Number.isInteger(+fieldValue) ? `'-integer'` : `'-real'`
          }) = 'integer-integer' THEN (
              CAST(${sourceInlinedValue} AS INTEGER) +
              CAST(${+fieldValue} AS INTEGER)
            )
            WHEN (json_type(${sourceInlinedValue}) || ${
            Number.isInteger(+fieldValue) ? `'-integer'` : `'-real'`
          }) = 'integer-real' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${+fieldValue} AS REAL)
            )
            WHEN (json_type(${sourceInlinedValue}) || ${
            Number.isInteger(+fieldValue) ? `'-integer'` : `'-real'`
          }) = 'real-integer' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${+fieldValue} AS REAL)
            )
            WHEN (json_type(${sourceInlinedValue}) || ${
            Number.isInteger(+fieldValue) ? `'-integer'` : `'-real'`
          }) = 'real-real' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${+fieldValue} AS REAL)
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
