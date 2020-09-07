import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:update-to-set-expression'
)

const allowedOperatorNames = new Set(['$set', '$unset', '$inc'])

const updateToSetExpression = (
  expression,
  escapeId,
  escape,
  makeNestedPath
) => {
  const updatingFieldsDescriptors = new Set()
  const updatingFields = new Map()

  for (let operatorName of Object.keys(expression)) {
    if (!allowedOperatorNames.has(operatorName)) {
      log.warn(`Update operator "${operatorName}" is invalid`)
      continue
    }
    for (let fieldName of Object.keys(expression[operatorName])) {
      const fieldValue = expression[operatorName][fieldName]
      const [baseName, ...nestedPath] = fieldName.split('.')
      let updatingFieldLevelMap = updatingFields
      let updatingFieldDescriptor = null

      for (const partName of [baseName, ...nestedPath]) {
        if (!updatingFieldLevelMap.has(partName)) {
          updatingFieldLevelMap.set(partName, {
            key:
              updatingFieldDescriptor != null
                ? `${updatingFieldDescriptor.key}.${partName}`
                : partName,
            nestedKey: nestedPath,
            baseName,
            selectedOperation: null,
            children: new Map(),
            $set: null,
            $unset: null,
            $inc: null,
          })
        }
        updatingFieldDescriptor = updatingFieldLevelMap.get(partName)
        updatingFieldLevelMap = updatingFieldDescriptor.children

        updatingFieldsDescriptors.add(updatingFieldDescriptor)
      }

      updatingFieldDescriptor[operatorName] = fieldValue
    }
  }

  for (const descriptor of updatingFieldsDescriptors) {
    const flagUnset = descriptor['$unset'] != null
    const flagSet = descriptor['$set'] != null
    const flagInc = descriptor['$inc'] != null
    const flagChild = descriptor.children.size > 0

    if (
      Number(flagUnset) +
        Number(flagSet) +
        Number(flagInc) +
        Number(flagChild) !==
      1
    ) {
      log.warn(`Updating set for key "${descriptor.key}" came into conflict`)
      log.warn(`Either key includes "$set", "$unset", "$inc" simultaneously`)
      log.warn(`Either key has children update nodes`)
    }

    switch (true) {
      case flagUnset:
        descriptor.selectedOperation = '$unset'
        descriptor['$set'] = null
      // eslint-disable-next-line no-fallthrough
      case flagSet:
        descriptor.selectedOperation =
          descriptor.selectedOperation != null
            ? descriptor.selectedOperation
            : '$set'
        descriptor['$inc'] = null
      // eslint-disable-next-line no-fallthrough
      case flagInc:
        descriptor.selectedOperation =
          descriptor.selectedOperation != null
            ? descriptor.selectedOperation
            : '$inc'
        descriptor.children.clear()
      // eslint-disable-next-line no-fallthrough
      default:
        break
    }
  }

  for (const descriptor of updatingFieldsDescriptors) {
    if (descriptor.children.size !== 0) {
      continue
    }
    const baseDescriptor = updatingFields.get(descriptor.baseName)
    const operation = {
      operationName: descriptor.selectedOperation,
      fieldValue: descriptor[descriptor.selectedOperation],
    }
    if (descriptor.nestedKey.length > 0) {
      operation.nestedPath = descriptor.nestedKey
    }

    if (baseDescriptor === descriptor) {
      baseDescriptor.operations = operation
    } else if (Array.isArray(baseDescriptor.operations)) {
      baseDescriptor.operations.push(operation)
    } else {
      baseDescriptor.operations = [operation]
    }
  }

  let inlineTableNameIdx = 0
  const updateOperations = new Map()
  for (const [baseKey, baseDescriptor] of updatingFields) {
    updateOperations.set(baseKey, baseDescriptor.operations)
  }

  const updateExprArray = []
  updatingFieldsDescriptors.clear()
  updatingFields.clear()

  for (const [baseName, operations] of updateOperations) {
    const isBaseOperation = !Array.isArray(operations)

    if (isBaseOperation && operations.operationName === '$unset') {
      updateExprArray.push(`${escapeId(baseName)} = NULL `)
    } else if (isBaseOperation && operations.operationName === '$set') {
      const fieldValue = operations.fieldValue
      updateExprArray.push(
        `${escapeId(baseName)} = ${
          fieldValue != null
            ? `CAST(${escape(JSON.stringify(fieldValue))} AS JSONB)`
            : null
        } `
      )
    } else if (isBaseOperation && operations.operationName === '$inc') {
      const inlineTableName = escapeId(`inline-table-${inlineTableNameIdx++}`)
      const fieldValue = operations.fieldValue

      updateExprArray.push(
        `${escapeId(baseName)} = CAST(( (SELECT CAST(CASE
          WHEN jsonb_typeof(${inlineTableName}.${escapeId('val')}) = ${escape(
          'string'
        )} THEN quote_ident(
            CAST(${inlineTableName}.${escapeId('val')}  #>> '{}' AS VARCHAR) ||
            CAST(${escape(fieldValue)} AS VARCHAR)
          )
          WHEN jsonb_typeof(${inlineTableName}.${escapeId('val')}) = ${escape(
          'number'
        )} THEN CAST((
            CAST(${inlineTableName}.${escapeId(
          'val'
        )}  #>> '{}' AS DECIMAL(48, 16)) +
            CAST(${+fieldValue} AS DECIMAL(48, 16))
          ) AS VARCHAR)
          ELSE (
            SELECT ${escape('Invalid JSON type for $inc operation')}
            FROM ${escapeId('pg_catalog')}.${escapeId('pg_class')}
          )
        END AS JSONB) AS ${escapeId('pg_catalog')} FROM (
          SELECT ${escapeId(baseName)} AS ${escapeId('val')}
        ) ${inlineTableName}) ) AS JSONB)`
      )
    } else if (!isBaseOperation) {
      let updateExpr = escapeId(baseName)
      for (const { operationName, nestedPath, fieldValue } of operations) {
        if (operationName === '$unset') {
          updateExpr = `${updateExpr} #- '${makeNestedPath(nestedPath)}' `
        } else if (operationName === '$set') {
          updateExpr = `jsonb_set(
            ${updateExpr},
            '${makeNestedPath(nestedPath)}',
            ${
              fieldValue != null
                ? `CAST(${escape(JSON.stringify(fieldValue))} AS JSONB)`
                : null
            }
            ) `
        } else if (operationName === '$inc') {
          const inlineTableName = escapeId(
            `inline-table-${inlineTableNameIdx++}`
          )

          updateExpr = `(SELECT jsonb_set(${inlineTableName}.${escapeId(
            'val'
          )}, '${makeNestedPath(nestedPath)}', CAST(CASE
            WHEN jsonb_typeof(${inlineTableName}.${escapeId(
            'val'
          )} #> '${makeNestedPath(nestedPath)}' ) = ${escape(
            'string'
          )} THEN quote_ident(
              CAST(${inlineTableName}.${escapeId('val')} #>> '${makeNestedPath(
            nestedPath
          )}' AS VARCHAR) ||
              CAST(${escape(fieldValue)} AS VARCHAR)
            )
            WHEN jsonb_typeof(${inlineTableName}.${escapeId(
            'val'
          )} #> '${makeNestedPath(nestedPath)}' ) = ${escape(
            'number'
          )} THEN CAST((
              CAST(${inlineTableName}.${escapeId('val')} #>> '${makeNestedPath(
            nestedPath
          )}' AS DECIMAL(48, 16)) +
              CAST(${+fieldValue} AS DECIMAL(48, 16))
            ) AS VARCHAR)
            ELSE (
              SELECT ${escape('Invalid JSON type for $inc operation')}
              FROM ${escapeId('pg_catalog')}.${escapeId('pg_class')}
            )
          END AS JSONB)) AS ${escapeId('pg_catalog')} FROM (
            SELECT ${updateExpr} AS ${escapeId('val')}
          ) ${inlineTableName}
          )`
        }
      }

      updateExprArray.push(`${escapeId(baseName)} = ${updateExpr}`)
    }
  }

  return updateExprArray.join(', ')
}

export default updateToSetExpression
