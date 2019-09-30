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
              `${escapeId(baseName)} = ${escapeId(
                baseName
              )} - '${makeNestedPath(nestedPath)}' `
            )
          } else {
            updateExprArray.push(`${escapeId(baseName)} = NULL `)
          }
          break
        }

        case '$set': {
          let updatingInlinedValue =
            fieldValue != null
              ? `CAST(${escape(JSON.stringify(fieldValue))} AS JSONB)`
              : null

          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = jsonb_set(
                ${escapeId(baseName)},
                '${makeNestedPath(nestedPath)}',
                ${updatingInlinedValue}
              ) `
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
              ? `${escapeId(baseName)} #> '${makeNestedPath(nestedPath)}'`
              : escapeId(baseName)

          const extractedInlinedValue =
            nestedPath.length > 0
              ? `${escapeId(baseName)} #>> '${makeNestedPath(nestedPath)}'`
              : `${escapeId(baseName)} #>> '{}'`

          const targetInlinedPrefix =
            nestedPath.length > 0
              ? `${escapeId(baseName)} = jsonb_set(${escapeId(
                  baseName
                )}, '${makeNestedPath(nestedPath)}',`
              : `${escapeId(baseName)} =  CAST((`

          const targetInlinedPostfix =
            nestedPath.length > 0 ? ')' : ' ) AS JSONB)'

          let updatingInlinedValue = `CAST(CASE
            WHEN jsonb_typeof(${sourceInlinedValue}) = ${escape(
            'string'
          )} THEN quote_ident(
              CAST(${extractedInlinedValue} AS VARCHAR) ||
              CAST(${escape(fieldValue)} AS VARCHAR)
            )
            WHEN jsonb_typeof(${sourceInlinedValue}) = ${escape(
            'number'
          )} THEN CAST((
              CAST(${extractedInlinedValue} AS DECIMAL(48, 16)) +
              CAST(${+fieldValue} AS DECIMAL(48, 16))
            ) AS VARCHAR)
            ELSE (
              SELECT ${escape('Invalid JSON type for $inc operation')}
              FROM ${escapeId('pg_catalog')}.${escapeId('pg_class')}
            )
          END AS JSONB)`

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
