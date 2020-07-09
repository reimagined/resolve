const allowedOperatorNames = new Set(['$set', '$unset', '$inc'])
const EMPTY = Symbol('EMPTY')

const validateUpdateExpression = (expression, errors) => {
  if (expression == null || expression.constructor !== Object) {
    errors.push(`Update expression is not object`)
    return
  }

  const updatingFieldsDescriptors = new Set()
  const updatingFields = new Map()
  let isEmptyUpdate = true

  for (let operatorName of Object.keys(expression)) {
    if (!allowedOperatorNames.has(operatorName)) {
      errors.push(`Update operator "${operatorName}" is invalid`)
      continue
    }
    isEmptyUpdate = false
    for (let fieldName of Object.keys(expression[operatorName])) {
      const fieldValue = expression[operatorName][fieldName]
      const [baseName, ...nestedPath] = fieldName.split('.')
      let updatingFieldLevelMap = updatingFields
      let updatingFieldDescriptor = EMPTY

      for (const partName of [baseName, ...nestedPath]) {
        if (!updatingFieldLevelMap.has(partName)) {
          updatingFieldLevelMap.set(partName, {
            key:
              updatingFieldDescriptor !== EMPTY
                ? `${updatingFieldDescriptor.key}.${partName}`
                : partName,
            nestedKey: nestedPath,
            baseName,
            selectedOperation: EMPTY,
            children: new Map(),
            $set: EMPTY,
            $unset: EMPTY,
            $inc: EMPTY
          })
        }
        updatingFieldDescriptor = updatingFieldLevelMap.get(partName)
        updatingFieldLevelMap = updatingFieldDescriptor.children

        updatingFieldsDescriptors.add(updatingFieldDescriptor)
      }

      updatingFieldDescriptor[operatorName] = fieldValue

      if (
        !(
          fieldValue == null ||
          fieldValue.constructor === Number ||
          fieldValue.constructor === String ||
          fieldValue.constructor === Boolean ||
          fieldValue.constructor === Object ||
          Array.isArray(fieldValue)
        )
      ) {
        errors.push(`Value should be serializable`)
      }
    }
  }

  if (isEmptyUpdate) {
    errors.push(`Update operator is empty`)
  }

  for (const descriptor of updatingFieldsDescriptors) {
    const flagUnset = descriptor['$unset'] !== EMPTY
    const flagSet = descriptor['$set'] !== EMPTY
    const flagInc = descriptor['$inc'] !== EMPTY
    const flagChild = descriptor.children.size > 0

    if (
      Number(flagUnset) +
        Number(flagSet) +
        Number(flagInc) +
        Number(flagChild) !==
      1
    ) {
      errors.push(
        [
          `Updating set for key "${descriptor.key}" came into conflict: `,
          `either key includes "$set", "$unset", "$inc" simultaneously, `,
          `either key has children update nodes`
        ].join('\n')
      )
    }

    switch (true) {
      case flagUnset:
        descriptor.selectedOperation = '$unset'
        descriptor['$set'] = EMPTY
      // eslint-disable-next-line no-fallthrough
      case flagSet:
        descriptor.selectedOperation =
          descriptor.selectedOperation !== EMPTY
            ? descriptor.selectedOperation
            : '$set'
        descriptor['$inc'] = EMPTY
      // eslint-disable-next-line no-fallthrough
      case flagInc:
        descriptor.selectedOperation =
          descriptor.selectedOperation !== EMPTY
            ? descriptor.selectedOperation
            : '$inc'
        descriptor.children.clear()
      // eslint-disable-next-line no-fallthrough
      default:
        break
    }
  }
}

export default validateUpdateExpression
