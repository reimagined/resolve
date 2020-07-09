import validateSearchExpression from './validate-search-expression'
import maybeThrowError from './maybe-throw-error'

const del = async (readModelName, tableName, searchExpression) => {
  const errors = []
  validateSearchExpression(searchExpression, errors)
  maybeThrowError(errors)
}

export default del
