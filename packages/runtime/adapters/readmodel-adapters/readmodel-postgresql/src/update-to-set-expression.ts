import type {
  ObjectFixedUnionToIntersectionByKeys,
  UpdateToSetExpressionMethod,
  ObjectFixedKeys,
  UpdateFieldDescriptor,
} from './types'

const updateToSetExpression: UpdateToSetExpressionMethod = (
  expression,
  escapeId,
  escapeStr,
  makeNestedPath
) => {
  const updatingFieldsDescriptors = new Set<UpdateFieldDescriptor>()
  const updatingFields = new Map<string, UpdateFieldDescriptor>()

  for (let operatorName of Object.keys(expression) as Array<
    ObjectFixedKeys<typeof expression>
  >) {
    if (
      !(
        operatorName === '$set' ||
        operatorName === '$unset' ||
        operatorName === '$inc'
      )
    ) {
      // eslint-disable-next-line no-console
      console.warn(`Update operator "${operatorName}" is invalid`)
      continue
    }
    const extractedExpression = (expression as ObjectFixedUnionToIntersectionByKeys<
      typeof expression,
      typeof operatorName
    >)[operatorName]
    for (let fieldName of Object.keys(extractedExpression)) {
      const fieldValue = extractedExpression[fieldName]
      const [baseName, ...nestedPath] = fieldName.split('.')
      let updatingFieldLevelMap = updatingFields
      let updatingFieldDescriptor:
        | UpdateFieldDescriptor
        | null
        | undefined = null

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
        updatingFieldDescriptor = updatingFieldLevelMap.get(
          partName
        ) as UpdateFieldDescriptor
        updatingFieldLevelMap = updatingFieldDescriptor.children

        updatingFieldsDescriptors.add(updatingFieldDescriptor)
      }

      void (((updatingFieldDescriptor as UpdateFieldDescriptor)[
        operatorName
      ] as typeof fieldValue) = fieldValue)
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
      /* eslint-disable no-console */
      console.warn(
        `Updating set for key "${descriptor.key}" came into conflict`
      )
      console.warn(
        `Either key includes "$set", "$unset", "$inc" simultaneously`
      )
      console.warn(`Either key has children update nodes`)
      /* eslint-enable no-console */
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
    const baseDescriptor = updatingFields.get(
      descriptor.baseName
    ) as UpdateFieldDescriptor
    const operationName = descriptor.selectedOperation
    const fieldValue = operationName != null ? descriptor[operationName] : null
    const operation: {
      operationName: typeof operationName
      fieldValue: typeof fieldValue
      nestedPath?: typeof descriptor.nestedKey
    } = { operationName, fieldValue }
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
  const updateOperations = new Map<
    string,
    UpdateFieldDescriptor['operations']
  >()
  for (const [baseKey, baseDescriptor] of updatingFields) {
    updateOperations.set(baseKey, baseDescriptor.operations)
  }

  const updateExprArray: Array<string> = []
  updatingFieldsDescriptors.clear()
  updatingFields.clear()

  for (const [baseName, operations] of updateOperations) {
    if (!Array.isArray(operations) && operations != null) {
      const baseOperation = operations
      if (baseOperation.operationName === '$unset') {
        updateExprArray.push(`${escapeId(baseName)} = NULL `)
      } else if (baseOperation.operationName === '$set') {
        const fieldValue = baseOperation.fieldValue
        updateExprArray.push(
          `${escapeId(baseName)} = ${
            fieldValue != null
              ? `CAST(${escapeStr(JSON.stringify(fieldValue))} AS JSONB)`
              : null
          } `
        )
      } else if (baseOperation.operationName === '$inc') {
        const inlineTableName = escapeId(`inline-table-${inlineTableNameIdx++}`)
        const fieldValue = baseOperation.fieldValue

        updateExprArray.push(
          `${escapeId(baseName)} = CAST(( (SELECT CAST(CASE
            WHEN jsonb_typeof(${inlineTableName}.${escapeId(
            'val'
          )}) = ${escapeStr('string')} THEN quote_ident(
              CAST(${inlineTableName}.${escapeId(
            'val'
          )}  #>> '{}' AS VARCHAR) ||
              CAST(${escapeStr(fieldValue as string)} AS VARCHAR)
            )
            WHEN jsonb_typeof(${inlineTableName}.${escapeId(
            'val'
          )}) = ${escapeStr('number')} THEN CAST((
              CAST(${inlineTableName}.${escapeId(
            'val'
          )}  #>> '{}' AS DECIMAL(48, 16)) +
              CAST(${+(fieldValue as number)} AS DECIMAL(48, 16))
            ) AS VARCHAR)
            ELSE (
              SELECT ${escapeStr('Invalid JSON type for $inc operation')}
              FROM ${escapeId('pg_catalog')}.${escapeId('pg_class')}
            )
          END AS JSONB) AS ${escapeId('pg_catalog')} FROM (
            SELECT ${escapeId(baseName)} AS ${escapeId('val')}
          ) ${inlineTableName}) ) AS JSONB)`
        )
      }
    } else if (Array.isArray(operations)) {
      let updateExpr = escapeId(baseName)
      for (const {
        operationName,
        nestedPath,
        fieldValue,
      } of operations as Array<Required<typeof operations[0]>>) {
        if (operationName === '$unset') {
          updateExpr = `${updateExpr} #- '${makeNestedPath(nestedPath)}' `
        } else if (operationName === '$set') {
          updateExpr = `jsonb_set(
            ${updateExpr},
            '${makeNestedPath(nestedPath)}',
            ${
              fieldValue != null
                ? `CAST(${escapeStr(JSON.stringify(fieldValue))} AS JSONB)`
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
          )} #> '${makeNestedPath(nestedPath)}' ) = ${escapeStr(
            'string'
          )} THEN quote_ident(
              CAST(${inlineTableName}.${escapeId('val')} #>> '${makeNestedPath(
            nestedPath
          )}' AS VARCHAR) ||
              CAST(${escapeStr(fieldValue as string)} AS VARCHAR)
            )
            WHEN jsonb_typeof(${inlineTableName}.${escapeId(
            'val'
          )} #> '${makeNestedPath(nestedPath)}' ) = ${escapeStr(
            'number'
          )} THEN CAST((
              CAST(${inlineTableName}.${escapeId('val')} #>> '${makeNestedPath(
            nestedPath
          )}' AS DECIMAL(48, 16)) +
              CAST(${+(fieldValue as number)} AS DECIMAL(48, 16))
            ) AS VARCHAR)
            ELSE (
              SELECT ${escapeStr('Invalid JSON type for $inc operation')}
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
