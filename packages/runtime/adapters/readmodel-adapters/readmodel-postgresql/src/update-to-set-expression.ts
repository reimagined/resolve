import type {
  ObjectFixedUnionToIntersectionByKeys,
  UpdateToSetExpressionMethod,
  ObjectFixedKeys,
  UpdateFieldDescriptor,
} from './types'

const empty = (Symbol('empty') as unknown) as null

const updateToSetExpression: UpdateToSetExpressionMethod = (
  expression,
  escapeId,
  escapeStr,
  makeNestedPath,
  splitNestedPath
) => {
  const updatingFieldsDescriptors = new Set<UpdateFieldDescriptor>()
  const updatingFields = new Map<string, UpdateFieldDescriptor>()
  const errors: Array<Error> = []

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
      errors.push(new Error(`Update operator "${operatorName}" is invalid`))
      continue
    }
    const extractedExpression = (expression as ObjectFixedUnionToIntersectionByKeys<
      typeof expression,
      typeof operatorName
    >)[operatorName]
    for (let fieldName of Object.keys(extractedExpression)) {
      const fieldValue = extractedExpression[fieldName]
      const [baseName, ...nestedPath] = splitNestedPath(fieldName)
      let updatingFieldLevelMap = updatingFields
      let updatingFieldDescriptor:
        | UpdateFieldDescriptor
        | null
        | undefined = null

      for (const partName of [baseName, ...nestedPath]) {
        if (!updatingFieldLevelMap.has(partName)) {
          updatingFieldLevelMap.set(partName, {
            key:
              updatingFieldDescriptor !== empty &&
              updatingFieldDescriptor != null
                ? `${updatingFieldDescriptor.key}.${partName}`
                : partName,
            nestedKey: nestedPath,
            baseName,
            selectedOperation: empty,
            children: new Map(),
            $set: empty,
            $unset: empty,
            $inc: empty,
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
    const flags = {
      unset: descriptor['$unset'] !== empty,
      set: descriptor['$set'] !== empty,
      inc: descriptor['$inc'] !== empty,
      child: descriptor.children.size > 0
    }

    if (Object.values(flags).reduce((acc, flag) => ((+flag) + acc), 0) !== 1) {
      errors.push(new Error([
        `Updating set for key "${descriptor.key}" came into conflict: `,
        `either key includes "$set", "$unset", "$inc" simultaneously, `,
        `either key has children update nodes`
      ].join('')))
    }

    switch (true) {
      case flags.unset:
        descriptor.selectedOperation = '$unset'
        descriptor['$set'] = empty
      // eslint-disable-next-line no-fallthrough
      case flags.set:
        descriptor.selectedOperation =
          descriptor.selectedOperation !== empty
            ? descriptor.selectedOperation
            : '$set'
        descriptor['$inc'] = empty
      // eslint-disable-next-line no-fallthrough
      case flags.inc:
        descriptor.selectedOperation =
          descriptor.selectedOperation !== empty
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
    const fieldValue =
      operationName !== empty && operationName != null
        ? descriptor[operationName]
        : empty
    
    if(fieldValue === empty) {
      errors.push(new Error(`Empty field value at ${descriptor.key}`))
    }

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
              : `CAST('null' AS JSONB)`
          } `
        )
      } else if (baseOperation.operationName === '$inc') {
        const inlineTableName = escapeId(`inline-table-${inlineTableNameIdx++}`)
        const fieldValue = baseOperation.fieldValue
        const fieldValueType = escapeStr(fieldValue != null ? (
          fieldValue.constructor === String ? 'string' :
          fieldValue.constructor === Number ? 'number' 
          : 'unknown'
        ) : 'unknown'
        )

        updateExprArray.push(
          `${escapeId(baseName)} = (SELECT CASE 
          WHEN (jsonb_typeof(${inlineTableName}."val") || '-' || ${fieldValueType} ) = 'string-string' THEN to_jsonb(
            CAST(${inlineTableName}."val" #>> '{}' AS VARCHAR) ||
            CAST(${escapeStr(`${fieldValue}`)} AS VARCHAR)
          )
          WHEN (jsonb_typeof(${inlineTableName}."val") || '-' || ${fieldValueType} ) = 'number-number' THEN to_jsonb(
            CAST(${inlineTableName}."val" #>> '{}' AS DECIMAL(48, 16)) +
            CAST(${+(fieldValue as number)} AS DECIMAL(48, 16))
          )
          ELSE to_jsonb(jsonb_typeof((SELECT 'MalformedIncOperataion')::jsonb))
          END FROM (
            SELECT ${escapeId(baseName)} AS "val"
          ) ${inlineTableName})
          `
        )
      }
    } else if (Array.isArray(operations)) {
      let updateExpr = escapeId(baseName)
      for (const {
        operationName,
        nestedPath,
        fieldValue,
      } of operations as Array<Required<typeof operations[0]>>) {
        const inlineTableName = escapeId(`inline-table-${inlineTableNameIdx++}`)
        if (operationName === '$unset') {
          updateExprArray.push(
            `(SELECT CASE 
            WHEN jsonb_typeof(${inlineTableName}."val" #> '${makeNestedPath(nestedPath)}') IS NOT NULL THEN 
            ${inlineTableName}."val" #- '${makeNestedPath(nestedPath)}'
            ELSE to_jsonb(jsonb_typeof((SELECT 'MalformedUnsetOperataion')::jsonb))
            END FROM (
              SELECT ${updateExpr} AS "val"
            ) ${inlineTableName})
            `
          )
        } else if (operationName === '$set') {
          const baseNestedPath = makeNestedPath(nestedPath.slice(0,-1))
          const lastNestedPathElementType = escapeStr(nestedPath[nestedPath.length-1] != null ?
            (!isNaN(+nestedPath[nestedPath.length-1]) ? 'number' : 'string') :
            'unknown')

          updateExprArray.push(
            `(SELECT CASE 
            WHEN ((jsonb_typeof(${inlineTableName}."val" #> '${baseNestedPath}') || '-' || ${lastNestedPathElementType} ) = 'object-string' OR
            jsonb_typeof(${inlineTableName}."val" #> '${baseNestedPath}') || '-' || ${lastNestedPathElementType} ) = 'array-number') THEN
            jsonb_set(${updateExpr}, '${makeNestedPath(nestedPath)}', ${fieldValue != null
              ? `CAST(${escapeStr(JSON.stringify(fieldValue))} AS JSONB)`
              : `CAST('null' AS JSONB)`
            })
            ELSE to_jsonb(jsonb_typeof((SELECT 'MalformedSetOperataion')::jsonb))
            END FROM (
              SELECT ${updateExpr} AS "val"
            ) ${inlineTableName})
            `
          )
        } else if (operationName === '$inc') {
          const fieldValueType = escapeStr(fieldValue != null ? (
            fieldValue.constructor === String ? 'string' :
            fieldValue.constructor === Number ? 'number' 
            : 'unknown'
          ) : 'unknown'
          )
  
          updateExprArray.push(
            `(SELECT CASE 
            WHEN (jsonb_typeof(${inlineTableName}."val" #> '${nestedPath}')) || '-' || ${fieldValueType} ) = 'string-string' THEN to_jsonb(
              CAST(${inlineTableName}."val" #>> '${nestedPath}' AS VARCHAR) ||
              CAST(${escapeStr(`${fieldValue}`)} AS VARCHAR)
            )
            WHEN (jsonb_typeof(${inlineTableName}."val" #> '${nestedPath}') || '-' || ${fieldValueType} ) = 'number-number' THEN to_jsonb(
              CAST(${inlineTableName}."val" #>> '${nestedPath}' AS DECIMAL(48, 16)) +
              CAST(${+(fieldValue as number)} AS DECIMAL(48, 16))
            )
            ELSE to_jsonb(jsonb_typeof((SELECT 'MalformedIncOperataion')::jsonb))
            END FROM (
              SELECT ${updateExpr} AS "val"
            ) ${inlineTableName})
            `
          )
        }
      }

      updateExprArray.push(`${escapeId(baseName)} = ${updateExpr}`)
    }
  }

  if(errors.length > 0) {
    const summaryError = new Error(errors.map(({ message }) => message).join('\n'))
    summaryError.stack = errors.map(({ stack }) => stack).join('\n')
    throw summaryError
  }

  return updateExprArray.join(', ')
}

export default updateToSetExpression
