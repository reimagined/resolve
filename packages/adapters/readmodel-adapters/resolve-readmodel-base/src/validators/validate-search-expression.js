const allowedComparisonOperators = new Set([
  '$lt',
  '$lte',
  '$gt',
  '$gte',
  '$eq',
  '$ne'
])
const allowedLogicalOperators = new Set(['$and', '$or', '$not'])

const validateSearchExpression = (expression, errors) => {
  if (expression == null || expression.constructor !== Object) {
    errors.push(`Search expression is not object`)
    return
  }

  const keys = Object.keys(expression)
  const operators = keys.filter(key => key.indexOf('$') > -1)

  if (!(operators.length === 0 || operators.length === keys.length)) {
    errors.push(`Impossible to mix operators with concrete values`)
    return
  }

  if (operators.length > 0) {
    for (let operator of operators) {
      if (!allowedLogicalOperators.has(operator)) {
        errors.push(`Wrong operator ${operator}`)
        continue
      }

      if (operator === '$not') {
        validateSearchExpression(operators[operator], errors)
        continue
      }

      if (!Array.isArray(operators[operator])) {
        errors.push(`Operator ${operator} requires array as argument`)
        continue
      }

      for (const expression of operators[operator]) {
        validateSearchExpression(expression, errors)
      }
    }
  } else {
    for (let fieldName of keys) {
      let fieldValue = expression[fieldName]

      if (fieldValue != null && fieldValue.constructor === Object) {
        const inOperators = Object.keys(fieldValue).filter(
          key => key.indexOf('$') > -1
        )

        if (!(inOperators.length === 0 || inOperators.length === 1)) {
          errors.push(`Should be zero or one operators`)
          continue
        }

        if (inOperators.length > 0) {
          if (!allowedComparisonOperators.has(inOperators[0])) {
            errors.push(`Wrong operator ${inOperators[0]}`)
          }

          fieldValue = fieldValue[inOperators[0]]
        }
      }

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
}

export default validateSearchExpression
