import validateSearchExpression from './validate-search-expression'
import maybeThrowError from './maybe-throw-error'

const count = async (readModelName, tableName, searchExpression) => {
  const errors = []
  validateSearchExpression(searchExpression, errors)
  maybeThrowError(errors)
}

export default count
